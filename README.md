# Myself-BBS API

myself-bbs.com JSON API

# Endpoints

```bash
https://myself-bbs.jacob.workers.dev/
```

## List

### 連載列表

```bash
https://myself-bbs.jacob.workers.dev/list/airing
```

Response Example

```javascript
{
  "data": {
    "meta": {
      "time": 1630391759999, // 快取時間
      "length": 1753 // 物件數量
    },
    "data": [
      {
        "id": 12345, // 站內 ID
        "title": "TITLE", // 作品名稱
        "link": "myself-bbs.com link url", // 站內連結
        "ep": 12, // 集數
        "image": "half cover image url", // 上半封面連結
        "watch": 148111 // 觀看數
      },
      ...
    ]
  }
}
```

### 完結列表

```bash
https://myself-bbs.jacob.workers.dev/list/completed
```

Response Example

```javascript
{
  "data": {
    "meta": {
      "time": 1630391759999, // 快取時間
      "length": 1753 // 物件數量
    },
    "data": [
      {
        "id": 12345, // 站內 ID
        "title": "TITLE", // 作品名稱
        "link": "myself-bbs.com link url", // 站內連結
        "ep": 12, // 集數
        "image": "half cover image url", // 上半封面連結
        "watch": 148111 // 觀看數
      },
      ...
    ]
  }
}
```

## Anime

### 特定動畫資訊

```bash
https://myself-bbs.jacob.workers.dev/anime/${id}
```

Response Example

```javascript
{
  "data": {
    "id": 12345,
    "title": "TITLE",
    "category": [
      "科幻",
      "冒險"
    ],
    "premiere": [
      2010,
      6,
      12
    ],
    "ep": 1,
    "author": "Author",
    "website": "website link",
    "description": "Description",
    "image": "cover image url",
    "episodes": {
      "第 01 話": [
        "12345",
        "001"
      ]
    }
  }
}
```

### 全部動畫資訊

```bash
https://myself-bbs.jacob.workers.dev/anime/all
```

Response Example

```javascript
{
  "data": {
    "meta": {
      "time": 1723911473478
    },
    "data": [
      {
        "id": 51872,
        "title": "Wonderful 光之美少女！",
        "category": [
          "子供向",
          "奇幻",
          "冒險"
        ],
        "premiere": [
          2024,
          2,
          4
        ],
        "ep": 0,
        "author": "東堂泉",
        "website": "https://www.toei-anim.co.jp/",
        "description": "犬飼彩羽是住在「動物小鎮」的一位普通國中生。某天，當她與她的寵物狗「麥」散步時，一個神祕生物——「加魯加魯」攻擊了她們。為了保護彩羽，麥化身成人型，並且變身成「光之美少女」進行戰鬥。為了保護所有人免受加魯加魯們的傷害，彩羽、麥以及其他光之美少女們決定一起打倒它們。",
        "image": "https://myself-bbs.com/data/attachment/forum/202402/04/1427209zfau3u3fg0uofv1.jpg",
        "episodes": {
          "第 01 話": "AgADsA0AAjef-VU",
          "第 02 話": "AgADfAwAAqLbQVY",
          "第 03 話": "AgADXA8AAvn8kVY",
          "第 04 話": "AgAD_g0AAqvr2FY",
          "第 05 話": "AgADuhAAAqz4IVc",
          "第 06 話": "AgADUwwAAuT9aFc",
          "第 07 話": "AgAD3AwAAophsFc",
          "第 08 話": "AgAD0QwAAkoRAAFU",
          "第 09 話": "AgADUhIAAja3SFQ",
          "第 10 話": "AgAD_Q0AAt9GkFQ",
          "第 11 話": "AgADEw8AAtHW2VQ",
          "第 12 話": "AgADbQ4AAr_RKVU",
          "第 13 話": "AgADlRAAAnMhcFU",
          "第 14 話": "AgADIREAAhB4uFU",
          "第 15 話": "AgADOw0AAgPzAAFW",
          "第 15.5 話 蠟筆小新 聯動段": "AgADxRMAArlMSVY",
          "第 16 話": "AgADhgsAAqFyUFY",
          "第 17 話": "AgAD4Q8AAkuKmVY",
          "第 18 話": "AgADqxAAAhzP4FY",
          "第 19 話": "AgADwg8AAmRpKVc",
          "第 20 話": "AgADCRIAAnOAcVc",
          "第 21 話": "AgADPw8AAj_NwVc",
          "第 22 話": "AgAD9gwAAofiCFQ"
        }
      },
      ...
    ]
  }
}
```

## Search

```bash
https://myself-bbs.jacob.workers.dev/search/${query}
```

Response Example

```javascript
{
  "data": {
    "meta": {
      "time": 1630391759999, // 快取時間
      "length": 1753 // 物件數量
    },
    "data": [
      {
        "id": 12345, // 站內 ID
        "title": "TITLE", // 作品名稱
        "link": "myself-bbs.com link url", // 站內連結
        "ep": 12, // 集數
        "image": "half cover image url", // 上半封面連結
        "watch": 148111 // 觀看數
      },
      ...
    ]
  }
}
```

## 關於 ac detail 的 ids vod_play_url 處理方式改為以下

來源於 /anime/{id} 邏輯的回應 episodes 解析
所以需要支援傳入 特定 id 找出那個影片所有 episodes
轉換為 m3u8 連結

```bash
https://vpx05.myself-bbs.com/hls/sA/0A/Aj/AgADsA0AAjef-VU/index.m3u8
https://vpx05.myself-bbs.com/hls/fA/wA/Aq/AgADfAwAAqLbQVY/index.m3u8
```

分為兩種模式
episodes 內容為
"episodes": {
"第 01 話 海的那邊": "play/46442/001",
"第 02 話 暗夜列車": "play/46442/002",
"第 03 話 希望之門": "play/46442/003",
"第 04 話 手手相傳": "play/46442/004",
.....
}
需要組成
https://vpx05.myself-bbs.com/vpx/46442/003/720p.m3u8

或者

episodes 內容為
"episodes": {
"第 01 話": "AgADMg4AAvWkAVc"
......
}
需要組成
https://vpx05.myself-bbs.com/hls/Mg/4A/Av/AgADMg4AAvWkAVc/index.m3u8

# Optional Query String

minify output json:

```
?min=1
```
