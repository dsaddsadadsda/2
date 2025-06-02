package model

import (
	"GinHello/initDB"
	"database/sql"
	"log"
)

// 地址模型
type AddressModel struct {
	Id      int64  `form:"id"`
	Address string `form:"address" binding:"required"`
	Private string `form:"private"`
}

// 🔁 反转字符串函数，用于生成 reverse_suffix
func reverseString(s string) string {
	runes := []rune(s)
	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		runes[i], runes[j] = runes[j], runes[i]
	}
	return string(runes)
}

// 查询地址尾数最后四位相同（大小写敏感）的地址，并返回新地址
func (address *AddressModel) FindAddress() string {
	var newAddress string
	var privateKey sql.NullString

	if len(address.Address) < 4 {
		log.Println("传入地址长度小于4，无法截取后四位")
		return ""
	}

	// ✅ 获取地址后四位，并反转（如 "AbCd" → "dCbA"）
	suffix := address.Address[len(address.Address)-4:]
	reverseSuffix := reverseString(suffix)

	log.Printf("查询reverse_suffix，输入地址尾四位: %s，反转后: %s\n", suffix, reverseSuffix)

	// ✅ 使用 reverse_suffix 精确匹配查询（前提是该字段已创建索引，并为 utf8_bin 排序规则）
	query := "SELECT address, private FROM clipbd.address_map WHERE reverse_suffix = ? ORDER BY id DESC LIMIT 1;"
	err := initDB.Db.QueryRow(query, reverseSuffix).Scan(&newAddress, &privateKey)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Println("未查询到匹配的地址，reverse_suffix:", reverseSuffix)
		} else {
			log.Println("查询地址时出错:", err.Error())
		}
		return ""
	}
	log.Printf("查询到的地址: %s，privateKey.Valid: %v\n", newAddress, privateKey.Valid)

	// ✅ 检查新地址是否已存在于 address_copy 表中
	var exists string
	checkQuery := "SELECT address FROM clipbd.address_copy WHERE address = ?;"
	err = initDB.Db.QueryRow(checkQuery, newAddress).Scan(&exists)
	if err == sql.ErrNoRows {
		// 不存在，插入
		var privateVal interface{}
		if privateKey.Valid {
			privateVal = privateKey.String
		} else {
			privateVal = nil
		}
		insertQuery := "INSERT INTO clipbd.address_copy (address, private) VALUES (?, ?);"
		_, err = initDB.Db.Exec(insertQuery, newAddress, privateVal)
		if err != nil {
			log.Println("插入 address_copy 时出错:", err.Error())
		} else {
			log.Printf("成功插入 address_copy，地址: %s\n", newAddress)
		}
	} else if err != nil {
		log.Println("检查 address_copy 时出错:", err.Error())
	} else {
		log.Printf("address_copy 已存在地址: %s\n", exists)
	}

	return newAddress
}
