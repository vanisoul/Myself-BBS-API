import { JSDOM } from "jsdom";
import fetch from "node-fetch";

export async function get_details(link) {
    const raw_html = await fetch(link).then((res) => res.text());
    const dom = new JSDOM(raw_html);
    const document = dom.window.document;
    const info_box = document.querySelector(".info_info");
    const info = info_box.querySelectorAll("ul >li");
    const full_title = document.querySelector("#pt a[href^=thread]").textContent;

    const id = +document.querySelector("#pt a[href^=thread]").href.match(/thread-(\d+)/)[1];
    const title =
        full_title.match(/([^]+?)【[^]+/) && full_title.match(/([^]+?)【[^]+/)[1]
            ? full_title.match(/([^]+?)【[^]+/)[1].trim()
            : "";
    const category = info[0].textContent
        .split(":")[1]
        .trim()
        .split(/[/／]/g)
        .map((x) => x.trim());
    const premiere = info[1].textContent.split(":")[1].trim()
        ? info[1].textContent.split(":")[1].match(/\d+/g).map(Number)
        : [0, 0, 0];
    const ep = info[2].textContent.split(":")[1].match(/\d+/)
        ? +info[2].textContent.split(":")[1].match(/\d+/)[0]
        : 0;
    const author = info[3].textContent.split(":")[1].trim();
    const website = info[4].textContent.substr(5).trim();
    const description = info_box.querySelector("#info_introduction > p").textContent.trim();
    const image = document.querySelector(".info_img_box > img").src;

    // 時間 如果比 2017/07/03 早要標記特殊模式
    let specialMode = false;
    const premiereDate = new Date(`${premiere[0]}-${premiere[1]}-${premiere[2]}`);
    if (premiereDate < new Date("2017-07-03")) {
        specialMode = true;
    }

    const baseEpisodes = [...document.querySelectorAll(".main_list > li")].reduce((obj, node) => {
        try {
            const name = node.querySelector("a").textContent.trim();
            const code = node
                .querySelector("a[data-href^='https://v.myself-bbs.com']")
                .dataset.href.trim()
                .match(/\/player\/(.+)/)[1];
            obj[name] = code;
        } catch (err) {
            console.error(err.message, link);
        }
        return obj;
    }, {});

    // baseEpisodes 是 play 開頭 ,且是 特殊模式的話, 需要轉換成 episodes
    const episodes = Object.fromEntries(Object.entries(baseEpisodes).map(([name, code]) => {
        if (specialMode && code.startsWith("play")) {
            return [name, `${code}_v01`];
        }
        return [name, code];
    }));

    return { id, title, category, premiere, ep, author, website, description, image, episodes };
}
