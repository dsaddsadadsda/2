package main

import (
	"bufio"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api"
	_ "github.com/go-sql-driver/mysql"
)

const (
	dbUser        = "tronuser"
	dbPassword    = "Kgosnbq"
	dbHost        = "127.0.0.1"
	dbPort        = 3306
	dbName        = "clipbd"
	tgToken       = "7393340023:AAGbWQD96FIBsnKP4Wu3bKg7FLpEvZgWVns"
	tgChatID      = int64(5741833506)
	allowedUserID = 5741833506
	tronNodeAPI   = "https://api.trongrid.io"
	usdtContract  = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t"
	pageSize      = 100
)

type AddressWatch struct {
	Address string
}

var (
	addresses      = make(map[string]*AddressWatch)
	addressesMutex sync.RWMutex
	db             *sql.DB

	latestTRXTxID   = make(map[string]string)
	latestUSDTTxID  = make(map[string]string)
	latestTxIDLock  sync.RWMutex
)

var helpText = `👋 机器人支持以下指令：

/add <地址>      - 添加监控地址
/del <地址>      - 删除监控地址
/addresses [页码] - 查看所有监控地址，带id分页（每页100条）
/count           - 查看已监控地址数量
/export          - 导出全部监控地址（发文件，纯地址）
/help            - 查看指令说明
/mapcount        - 查看address_map表有多少个地址
（支持上传txt/csv文档，每行一个地址，批量导入，自动去重）

上传文件导入：
- 普通上传：导入到监控表（address_copy），自动去重，导入后立即监控
- 文件名含map或map.csv/txt：只导入到address_map，不参与监控
`

func main() {
	var err error
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=utf8mb4", dbUser, dbPassword, dbHost, dbPort, dbName)
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		fmt.Println("[主进程] 数据库连接失败:", err)
		return
	}
	defer db.Close()
	if err = db.Ping(); err != nil {
		fmt.Println("[主进程] 数据库Ping失败:", err)
		return
	}
	fmt.Println("[主进程] 数据库连接成功")
	loadAddressesFromDB()
	go monitorLoop()
	go autoSyncAddresses()

	bot, err := tgbotapi.NewBotAPI(tgToken)
	if err != nil {
		fmt.Println("[主进程] Telegram Bot初始化失败:", err)
		return
	}
	fmt.Println("[主进程] Telegram Bot初始化成功")
	u := tgbotapi.NewUpdate(0)
	u.Timeout = 60
	updates, _ := bot.GetUpdatesChan(u)

	for update := range updates {
		if update.Message == nil {
			continue
		}
		if update.Message.From.ID != allowedUserID {
			fmt.Println("[主进程] 非授权用户尝试访问:", update.Message.From.ID)
			continue
		}
		text := update.Message.Text

		if text == "/help" || text == "/start" {
			bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, helpText))
			continue
		}
		if text == "/mapcount" {
			count := getMapCount()
			bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, fmt.Sprintf("address_map表共有%d个地址", count)))
			continue
		}
		if text == "/export" {
			exportAddresses(bot, update.Message.Chat.ID)
			continue
		}
		if strings.HasPrefix(text, "/add ") {
			addr := strings.TrimSpace(strings.TrimPrefix(text, "/add "))
			if addAddress(addr) {
				fmt.Println("[主进程] 添加地址成功:", addr)
				bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, "添加成功: "+addr))
			} else {
				fmt.Println("[主进程] 添加地址失败或已存在:", addr)
				bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, "地址已存在或无效"))
			}
			continue
		}
		if strings.HasPrefix(text, "/del ") {
			addr := strings.TrimSpace(strings.TrimPrefix(text, "/del "))
			if delAddress(addr) {
				fmt.Println("[主进程] 删除地址成功:", addr)
				bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, "删除成功: "+addr))
			} else {
				fmt.Println("[主进程] 删除地址失败:", addr)
				bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, "地址不存在"))
			}
			continue
		}
		// /addresses 或 /addresses <页码>
		if strings.HasPrefix(text, "/addresses") {
			page := 1
			parts := strings.Fields(text)
			if len(parts) > 1 {
				if p, err := strconv.Atoi(parts[1]); err == nil && p > 0 {
					page = p
				}
			}
			sendAddressesPage(bot, update.Message.Chat.ID, page)
			continue
		}
		if text == "/count" {
			addressesMutex.RLock()
			n := len(addresses)
			addressesMutex.RUnlock()
			bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, fmt.Sprintf("已监控%d个地址", n)))
			continue
		}
		if update.Message.Document != nil {
			fileID := update.Message.Document.FileID
			fileName := strings.ToLower(update.Message.Document.FileName)
			file, err := bot.GetFile(tgbotapi.FileConfig{FileID: fileID})
			if err != nil {
				fmt.Println("[主进程] 文件获取失败:", err)
				bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, "文件获取失败"))
				continue
			}
			url := file.Link(bot.Token)
			if strings.Contains(fileName, "map") {
				count, err := importAddressMapFromURL(url)
				if err != nil {
					fmt.Println("[主进程] address_map导入失败:", err)
					bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, "导入失败: "+err.Error()))
				} else {
					fmt.Println("[主进程] address_map导入成功, 数量:", count)
					bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, fmt.Sprintf("成功导入%d个新地址到address_map表", count)))
				}
			} else {
				count, err := importAddressesFromURL(url)
				if err != nil {
					fmt.Println("[主进程] address_copy导入失败:", err)
					bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, "导入失败: "+err.Error()))
				} else {
					fmt.Println("[主进程] address_copy导入成功, 数量:", count)
					bot.Send(tgbotapi.NewMessage(update.Message.Chat.ID, fmt.Sprintf("成功导入%d个新地址并加入监控", count)))
				}
			}
		}
	}
}

func autoSyncAddresses() {
	for {
		loadAddressesFromDB()
		time.Sleep(3 * time.Second)
	}
}

func loadAddressesFromDB() {
	addressesMutex.Lock()
	defer addressesMutex.Unlock()
	rows, err := db.Query("SELECT address FROM address_copy")
	if err != nil {
		fmt.Println("[DB] 读取address_copy失败:", err)
		return
	}
	defer rows.Close()
	newAddresses := make(map[string]*AddressWatch)
	for rows.Next() {
		var addr string
		if err := rows.Scan(&addr); err == nil {
			newAddresses[addr] = &AddressWatch{Address: addr}
		}
	}
	addresses = newAddresses
	fmt.Println("[DB] 监控地址同步完成, 总数:", len(addresses))
}

func addAddress(addr string) bool {
	addr = strings.TrimSpace(addr)
	if !isValidTRON(addr) {
		return false
	}
	addressesMutex.Lock()
	defer addressesMutex.Unlock()
	if _, ok := addresses[addr]; ok {
		return false
	}
	_, err := db.Exec("INSERT IGNORE INTO address_copy(address) VALUES (?)", addr)
	if err != nil {
		fmt.Println("[DB] 插入address_copy失败:", err)
		return false
	}
	addresses[addr] = &AddressWatch{Address: addr}
	return true
}

func delAddress(addr string) bool {
	addressesMutex.Lock()
	defer addressesMutex.Unlock()
	if _, ok := addresses[addr]; !ok {
		return false
	}
	_, err := db.Exec("DELETE FROM address_copy WHERE address=?", addr)
	if err != nil {
		fmt.Println("[DB] 删除address_copy失败:", err)
		return false
	}
	delete(addresses, addr)
	return true
}

func importAddressesFromURL(url string) (int, error) {
	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	tmpfile, err := os.CreateTemp("", "addrimport_*.txt")
	if err != nil {
		return 0, err
	}
	defer os.Remove(tmpfile.Name())
	_, err = io.Copy(tmpfile, resp.Body)
	if err != nil {
		return 0, err
	}
	tmpfile.Close()
	file, err := os.Open(tmpfile.Name())
	if err != nil {
		return 0, err
	}
	defer file.Close()
	addressSet := make(map[string]struct{}, 100000)
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		addr := strings.TrimSpace(scanner.Text())
		if isValidTRON(addr) {
			addressSet[addr] = struct{}{}
		}
	}
	if err := scanner.Err(); err != nil {
		return 0, err
	}
	batch := make([]string, 0, 5000)
	inserted := 0
	for addr := range addressSet {
		batch = append(batch, addr)
		if len(batch) == 5000 {
			n, err := batchInsertAddressCopy(batch)
			if err != nil {
				return inserted, err
			}
			inserted += n
			batch = batch[:0]
		}
	}
	if len(batch) > 0 {
		n, err := batchInsertAddressCopy(batch)
		if err != nil {
			return inserted, err
		}
		inserted += n
	}
	return inserted, nil
}

func batchInsertAddressCopy(addrs []string) (int, error) {
	if len(addrs) == 0 {
		return 0, nil
	}
	vals := make([]interface{}, 0, len(addrs))
	for _, a := range addrs {
		vals = append(vals, a)
	}
	sqlstr := "INSERT IGNORE INTO address_copy(address) VALUES " + strings.Repeat("(?),", len(addrs))
	sqlstr = sqlstr[:len(sqlstr)-1]
	res, err := db.Exec(sqlstr, vals...)
	if err != nil {
		fmt.Println("[DB] 批量插入address_copy失败:", err)
		return 0, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		fmt.Println("[DB] 获取批量插入影响行数失败:", err)
		return 0, err
	}
	return int(affected), nil
}

func importAddressMapFromURL(url string) (int, error) {
	resp, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	tmpfile, err := os.CreateTemp("", "addrmapimport_*.txt")
	if err != nil {
		return 0, err
	}
	defer os.Remove(tmpfile.Name())
	_, err = io.Copy(tmpfile, resp.Body)
	if err != nil {
		return 0, err
	}
	tmpfile.Close()
	file, err := os.Open(tmpfile.Name())
	if err != nil {
		return 0, err
	}
	defer file.Close()
	addressSet := make(map[string]struct{}, 100000)
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		addr := strings.TrimSpace(scanner.Text())
		if addr != "" {
			addressSet[addr] = struct{}{}
		}
	}
	if err := scanner.Err(); err != nil {
		return 0, err
	}
	batch := make([]string, 0, 5000)
	inserted := 0
	for addr := range addressSet {
		batch = append(batch, addr)
		if len(batch) == 5000 {
			n, err := batchInsertAddressMap(batch)
			if err != nil {
				return inserted, err
			}
			inserted += n
			batch = batch[:0]
		}
	}
	if len(batch) > 0 {
		n, err := batchInsertAddressMap(batch)
		if err != nil {
			return inserted, err
		}
		inserted += n
	}
	return inserted, nil
}

func batchInsertAddressMap(addrs []string) (int, error) {
	if len(addrs) == 0 {
		return 0, nil
	}
	vals := make([]interface{}, 0, len(addrs))
	for _, a := range addrs {
		vals = append(vals, a)
	}
	sqlstr := "INSERT IGNORE INTO address_map(address) VALUES " + strings.Repeat("(?),", len(addrs))
	sqlstr = sqlstr[:len(sqlstr)-1]
	res, err := db.Exec(sqlstr, vals...)
	if err != nil {
		fmt.Println("[DB] 批量插入address_map失败:", err)
		return 0, err
	}
	affected, err := res.RowsAffected()
	if err != nil {
		fmt.Println("[DB] 获取批量插入影响行数失败:", err)
		return 0, err
	}
	return int(affected), nil
}

func getMapCount() int {
	var n int
	err := db.QueryRow("SELECT COUNT(*) FROM address_map").Scan(&n)
	if err != nil {
		fmt.Println("[DB] 查询address_map数量失败:", err)
	}
	return n
}

func isValidTRON(addr string) bool {
	return len(addr) == 34 && strings.HasPrefix(addr, "T")
}

func monitorLoop() {
	bot, _ := tgbotapi.NewBotAPI(tgToken)
	fmt.Println("[监控] 监控协程启动")
	for {
		addressesMutex.RLock()
		lst := make([]*AddressWatch, 0, len(addresses))
		for _, v := range addresses {
			lst = append(lst, v)
		}
		addressesMutex.RUnlock()
		for _, w := range lst {
			// TRX监控
			trxTxID, trxDetail := getTRXTx(w.Address)
			fmt.Printf("[监控] 地址: %s, TRX最新txid: %s\n", w.Address, trxTxID)
			if trxTxID != "" && isNewTRXTx(w.Address, trxTxID) {
				fmt.Printf("[监控] 地址 %s 有新的TRX转账，准备推送: %s\n", w.Address, trxTxID)
				msg := tgbotapi.NewMessage(tgChatID, fmt.Sprintf("地址 %s 有新的TRX转账:\n%s", w.Address, trxDetail))
				_, err := bot.Send(msg)
				if err != nil {
					fmt.Println("[监控] TRX消息推送失败:", err)
				}
				setLatestTRXTx(w.Address, trxTxID)
			}
			// USDT监控
			usdtTxID, usdtDetail := getTRC20Tx(w.Address)
			fmt.Printf("[监控] 地址: %s, USDT最新txid: %s\n", w.Address, usdtTxID)
			if usdtTxID != "" && isNewUSDTTx(w.Address, usdtTxID) {
				fmt.Printf("[监控] 地址 %s 有新的USDT转账，准备推送: %s\n", w.Address, usdtTxID)
				msg := tgbotapi.NewMessage(tgChatID, fmt.Sprintf("地址 %s 有新的USDT转账:\n%s", w.Address, usdtDetail))
				_, err := bot.Send(msg)
				if err != nil {
					fmt.Println("[监控] USDT消息推送失败:", err)
				}
				setLatestUSDTTx(w.Address, usdtTxID)
			}
			time.Sleep(1 * time.Second)
		}
	}
}

func isNewTRXTx(addr, txid string) bool {
	latestTxIDLock.RLock()
	defer latestTxIDLock.RUnlock()
	return latestTRXTxID[addr] != txid
}
func setLatestTRXTx(addr, txid string) {
	latestTxIDLock.Lock()
	defer latestTxIDLock.Unlock()
	latestTRXTxID[addr] = txid
}
func isNewUSDTTx(addr, txid string) bool {
	latestTxIDLock.RLock()
	defer latestTxIDLock.RUnlock()
	return latestUSDTTxID[addr] != txid
}
func setLatestUSDTTx(addr, txid string) {
	latestTxIDLock.Lock()
	defer latestTxIDLock.Unlock()
	latestUSDTTxID[addr] = txid
}

func getTRXTx(addr string) (txid, detail string) {
	url := fmt.Sprintf("%s/v1/accounts/%s/transactions?limit=1&order_by=block_timestamp,desc", tronNodeAPI, addr)
	fmt.Printf("[TRX] 请求URL: %s\n", url)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println("[TRX] http.Get失败:", err)
		return
	}
	defer resp.Body.Close()
	var data struct {
		Data []struct {
			TxID    string `json:"txID"`
			RawData struct {
				Contract []struct {
					Parameter struct {
						Value struct {
							Amount int64  `json:"amount"`
							Owner  string `json:"owner_address"`
							To     string `json:"to_address"`
						} `json:"value"`
					} `json:"parameter"`
					Type string `json:"type"`
				} `json:"contract"`
			} `json:"raw_data"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		fmt.Println("[TRX] json解析失败:", err)
		return
	}
	if len(data.Data) == 0 {
		fmt.Println("[TRX] 无交易数据")
		return
	}
	tx := data.Data[0]
	v := tx.RawData.Contract[0].Parameter.Value
	amount := float64(v.Amount) / 1e6
	return tx.TxID, fmt.Sprintf("TxID: %s\n类型:TRX\n数量:%.6f", tx.TxID, amount)
}

func getTRC20Tx(addr string) (txid, detail string) {
	url := fmt.Sprintf("%s/v1/accounts/%s/transactions/trc20?limit=1&contract_address=%s&order_by=block_timestamp,desc", tronNodeAPI, addr, usdtContract)
	fmt.Printf("[USDT] 请求URL: %s\n", url)
	resp, err := http.Get(url)
	if err != nil {
		fmt.Println("[USDT] http.Get失败:", err)
		return
	}
	defer resp.Body.Close()
	var data struct {
		Data []struct {
			TransactionID string `json:"transaction_id"`
			Type         string `json:"type"`
			Value        string `json:"value"`
			From         string `json:"from"`
			To           string `json:"to"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		fmt.Println("[USDT] json解析失败:", err)
		return
	}
	if len(data.Data) == 0 {
		fmt.Println("[USDT] 无交易数据")
		return
	}
	tx := data.Data[0]
	val, err := strconv.ParseFloat(tx.Value, 64)
	if err != nil {
		fmt.Println("[USDT] 金额解析失败:", err)
	}
	val = val / 1e6
	return tx.TransactionID, fmt.Sprintf("TxID: %s\n类型:USDT\n数量:%.6f\nfrom: %s\nto: %s", tx.TransactionID, val, tx.From, tx.To)
}

// 导出全部监控地址，返回纯地址，每行一个，发txt文件
func exportAddresses(bot *tgbotapi.BotAPI, chatID int64) {
	rows, err := db.Query("SELECT address FROM address_copy ORDER BY id ASC")
	if err != nil {
		bot.Send(tgbotapi.NewMessage(chatID, "导出失败: "+err.Error()))
		return
	}
	defer rows.Close()
	var lines []string
	for rows.Next() {
		var addr string
		if err := rows.Scan(&addr); err == nil {
			lines = append(lines, addr)
		}
	}
	if len(lines) == 0 {
		bot.Send(tgbotapi.NewMessage(chatID, "没有监控地址"))
		return
	}
	tmpfile, err := os.CreateTemp("", "export_addresses_*.txt")
	if err != nil {
		bot.Send(tgbotapi.NewMessage(chatID, "生成临时文件失败: "+err.Error()))
		return
	}
	defer os.Remove(tmpfile.Name())
	tmpfile.WriteString(strings.Join(lines, "\n"))
	tmpfile.Close()

	doc := tgbotapi.NewDocumentUpload(chatID, tmpfile.Name())
	doc.Caption = "全部监控地址导出"
	if _, err := bot.Send(doc); err != nil {
		bot.Send(tgbotapi.NewMessage(chatID, "文件发送失败: "+err.Error()))
	}
}

// 分页发送监控地址，每页 100 条，带ID
func sendAddressesPage(bot *tgbotapi.BotAPI, chatID int64, page int) {
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * pageSize
	rows, err := db.Query("SELECT id, address FROM address_copy ORDER BY id ASC LIMIT ? OFFSET ?", pageSize, offset)
	if err != nil {
		bot.Send(tgbotapi.NewMessage(chatID, "查询失败: "+err.Error()))
		return
	}
	defer rows.Close()
	var lines []string
	for rows.Next() {
		var id int
		var addr string
		if err := rows.Scan(&id, &addr); err == nil {
			lines = append(lines, fmt.Sprintf("%d. %s", id, addr))
		}
	}
	if len(lines) == 0 {
		bot.Send(tgbotapi.NewMessage(chatID, fmt.Sprintf("第%d页无内容", page)))
		return
	}
	msg := fmt.Sprintf("监控地址列表（第%d页，每页%d条）:\n%s", page, pageSize, strings.Join(lines, "\n"))
	bot.Send(tgbotapi.NewMessage(chatID, msg))
}