// ==UserScript==
// @name         Unit Production/Wachtrij
// @version      5.0.0
// @description  Troop queue with grouped units + 3 column layout + background customization
// @author       The Invincble
// @include      https://*.grepolis.com/game/*
// @grant        none
// ==/UserScript==

(async function () {

    const sleep = (n) => new Promise(res => setTimeout(res, n));
    await sleep(1500);

    const STORAGE_KEY = "wachtrij_settings_v4";
	let lastSnapshot = "";

    const DEFAULT_SETTINGS = {
        backgroundType: "none",
        backgroundValue: "",
        opacity: 0.6,
        size: "cover"
    };

    const BUILTINS = {
        ocean: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
        sand: "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
        stone: "https://images.unsplash.com/photo-1501785888041-af3ef285b471"
    };

    function loadSettings() {
        try {
            return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
        } catch {
            return { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings(s) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }

    function get_units() {

        const units = {};

        for (const order of Object.values(MM.getModels().UnitOrder)) {
            units[order.getUnitId()] = (units[order.getUnitId()] || 0) + order.getCount();
        }

        const LAND = [
            "sword","slinger","archer","hoplite",
            "rider","chariot","catapult"
        ];

        const NAVAL = [
            "big_transporter","small_transporter",
            "bireme","attack_ship","demolition_ship",
            "trireme","colonize_ship"
        ];

        const MYTH = [
            "minotaur","manticore","medusa","harpy",
            "cyclops","centaur","pegasus",
            "hydra","cerberus","fury","griffin",
            "satyr","spartoi","ladon","calydonian_boar",
            "godsent"
        ];

        function renderGroup(title, unitList) {

            const present = unitList.filter(u => units[u]);
            if (!present.length) return "";

            const items = present.map(u => `
                <div style="display:flex; align-items:center; gap:6px;">
                    <div class="unit_icon40x40 unit ${u}"></div>
                    <span style="font-weight:bold;">${units[u]}</span>
                </div>
            `).join("");

            return `
                <div style="margin-bottom:26px;">
                    <div style="
                        font-family: Georgia, serif;
                        font-size:16px;
                        font-weight:bold;
                        color:#5a3b12;
                        text-shadow: 0 1px 0 #fff3d6;
                        padding-bottom:6px;
                        margin-bottom:12px;
                        border-bottom:1px solid rgba(90,59,18,0.35);
                    ">
                        ${title}
                    </div>

                    <div style="
                        display:grid;
                        grid-template-columns: repeat(3, 1fr);
                        gap:14px 24px;
                    ">
                        ${items}
                    </div>
                </div>
            `;
        }

        return `
            ${renderGroup("Land Units", LAND)}
            ${renderGroup("Naval Units", NAVAL)}
            ${renderGroup("Myth Units", MYTH)}
        `;
    }

    function makeContentHtml(content) {
    return `
        <div style="padding:20px 24px; color:#3a2a12;">
            <div id="wachtrijContent">
                ${content}
            </div>
        </div>
    `;
}


    function getWindowContainer() {
        const win = GPWindowMgr.getOpenFirst(GPWindowMgr.TYPE_DIALOG);
        if (!win) return null;
        return win.getJQElement().find(".gpwindow_content").get(0);
    }

    function applyBackground(container, settings) {
        if (!container) return;

        if (settings.backgroundType === "none") {
            container.style.background = "";
            return;
        }

        let url = settings.backgroundValue;
        if (settings.backgroundType === "builtin") {
            url = BUILTINS[url];
        }

        container.style.backgroundImage = `url("${url}")`;
        container.style.backgroundPosition = "center center";

        if (settings.size === "cover") {
            container.style.backgroundSize = "cover";
            container.style.backgroundRepeat = "no-repeat";
        } else if (settings.size === "contain") {
            container.style.backgroundSize = "contain";
            container.style.backgroundRepeat = "no-repeat";
        } else if (settings.size === "stretch") {
            container.style.backgroundSize = "100% 100%";
            container.style.backgroundRepeat = "no-repeat";
        } else {
            container.style.backgroundSize = "auto";
            container.style.backgroundRepeat = "repeat";
        }
    }

    function create_window() {

        GPWindowMgr.Create(GPWindowMgr.TYPE_DIALOG, "Unit Production");
        const w = GPWindowMgr.getOpenFirst(GPWindowMgr.TYPE_DIALOG);
        setTimeout(() => {
    w.setPosition(["center", 60]);
}, 50);
        w.setSize(400, 600);

        w.setContent2(makeContentHtml(get_units()));
		lastSnapshot = get_units();

        applyBackground(getWindowContainer(), loadSettings());
    }

	function update_live_content() {
    try {
        const newContent = get_units();

        // Only update DOM if something changed
        if (newContent !== lastSnapshot) {
            const container = document.getElementById("wachtrijContent");
            if (container) {
                container.innerHTML = newContent;
                lastSnapshot = newContent;
            }
        }

    } catch (e) {
        console.log("Live update error:", e);
    }
}


    function add_main_button() {

        if (document.getElementById("wachtrijMainButton")) return;

		const divwindow = document.getElementsByClassName('gods_area_buttons')[0];
        const b = document.createElement("div");
        b.id = "wachtrijMainButton";
        b.className = "btn_settings circle_button";
        b.style.left = "-5px";
		b.style.marginTop = "40px";
        b.style.zIndex = 9999;

        const i = document.createElement("div");
        i.style.width = "20px";
        i.style.height = "20px";
        i.style.margin = "6px 0 0 5px";
        i.style.background = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAA7AAAAOwBeShxvQAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAabSURBVFiFnZddbBTXFcd/587Meta73vUnxjJ2MCE0BApViCJAQo0gVWmahwChKTTqW1OVKjQ0echDpUatqrw0UlSRl6RqpaZtVAIkakMcEiIeIkJDG0JtPoIJkZryYRd/rHft3dmduXP7MGt71147plda7dx759z//55z/ufeEW6jTSzbtS4I5OdhUdbHG/U2d7n1HeAXwFj5N4zIPzDhhyjnlLz/2tCXrSmLAR5ftnu7njCvlMZZhonG4p3yUWoVBtg4j5lG6MXwCl9f85Y891x42wRGVn4rZWUS7xVHuN+YmfG6NqFxzWLpA3AWZL+cPHRq0QQmeva0e8P+QJAjVWVgQdtmQexFg081gzEv0CbPyuuv66lBNd/bfs7vnQ0OEGvk/wEHEESeYZhjZtPu+IIEsl2PPi2W3Ky5jFq83+dp38TlqNnwhFOTwETXrj35a/zaGzIP1bIOsqbW8O227aQzz0ONHBhs3Fkko2ILWafXCm5buRMz6JTGChTkBUqL9pAB2VIVzU9XP3SISwuDU2cItma5talEw90GNyVYFdOTw4b8gKLu4zipvgTM77BBIDlN96UH1iR39K8aVyNW7cQUSP1sBHdjDklb0BGv+Vplyw2GhEcSpD9JAlBC02dnGJDs5LhT7Np3rH9s2gPNYeJpNVob3O7WpF+8ge34EAKTUMwG/PtKyNAXAflsiFIQTwodKxy6VjnE4kLDUgU/LnDrdIHcqy4nGKQgGiBhQtkH/GraA6fWbx2581/NzbPBnZ6AxoPXUWEk3dASLl6FD971Kflz/dvaInz3MYcMFonlcdyEoH3DH36ZITtSVQwHMxv7O22AF7ev+0rTFXcOuEqaKvBcaPGXV4tMZg2JuOGulRadnYpUA4QhjBcVyWSk1BYCJgcmuFh0+OycPxscYGnqzNp7p0KwzS3NrS7pl25Og48WLf74Ow8J4eGtHj2dPioVcS6FgufYdDVHESwWIDfo88/TPpcHSnPWnWpWKA+WUc06K6iWj7u1QKzFAwMlUfz59x62Mnx/V56kUwAi09BAyXVIpWfs6+JQ1+OwbAwuXynOqwQD6+zyU7uE1QTqfzQSGYrAjas8cl+Jhs72MjigA3SxQMZuoCVdW/tr73XI5wynT87rhfaprG9WFSxVW4DjRkZeaIgVxmheUk/ajcDDZArd1IGVStCy1GKhdt+WGM2t8x45rTaAETzMzC4Se3PTz97wKC7gJOMY1yGsT2NNkfUNOoCsJwQaUFEyAig7WlhrwwN7kly/GvDR2/nZBPI2gGBGrYoSqq/FKIQWXmB47Y0GVnb0sO3bScRyInBbCFIxLFuwxNDU7nzpIbXkDrsWgdEoB0QuWUVhSij5IwnezgyRdXwA4q1pLKVAQZCqw7bLKWhMlCcTAaScBQlkR/ScMYNctAHiYezjsDizA7Fgwvan+3VxwaQccBV2rYzOa7BUdLRVXp0qpO9qTVOrYmx4ZlAwZ2yARwe6EpVFLWjSVIoidBTiqio5BX6IElC5ALQBS8C1Zg54ESpPqbFRQyFfxd6LWZywAayCtdOvmLnSPVa1QTdVDe5lNO5kDrRH2NaKcm2IW5Cc/6r02aceXgUBgbf2HesfUwChpzZPTehWzbklI1XGMiu/XD8AxwXPwwSlyPVhdWyKBUNYEfbx4eocEJEXAOzJO3Z2TFwLu0BQ9ehj67+YI2wdVPfPXwg5e06zvLOR+zvsyNNlFRz9TZb/XI78aVnChm+4bHq4nkwlATFH9vf2/x3A9j3rt0YbnAbGhnpyD+ZipTcwdC9E4P0PNGgYy9is3ubgRqsC1TmoteHMOwU+7/fJziTfLRPqJ6c6KvTNing7f2rOHW69p+/4WUO4FyhUEZiloJgVgSkFrS3lrCv7Ld06tzIOX5/egU9ovnfg+KXpC69qHj28Oj10+HEpi+ZA74VTochjwHQBn03Arov+12+OIVNbLifKV7fU4dTVLEpajHn8qXfPv1c5WLNI/7S3729Gwq3AfwHqE9XzqhzvO1dXFJ8yZnu3zd5nG1l2V1VhyoLs/Mnx84dmY817ShzovXBKiWzA8GZH14xbDTAxHsXTqlRdhQoalyh2PJliSbcNmONWKF976p2+v9bCWfAbZ39v3zVgx64fbjroG3nCEePcGp6ZH7oZsrS9TK6gwVXToRgf1je673ae3/vyJwcXwritz5xrRzftPn3CX3P98+I9GNbGG2TpD55JNkVXfKW1mJukrJftmH1IVpy8vJg1/wd7A41vpI0j2gAAAABJRU5ErkJggg==') center/contain no-repeat";


        b.appendChild(i);
        b.onclick = create_window;
		divwindow.appendChild(b);


    }
	setInterval(() => {
    const win = GPWindowMgr.getOpenFirst(GPWindowMgr.TYPE_DIALOG);
    if (win) {
        update_live_content();
    }
}, 2000); // every 2 seconds

    add_main_button();

})();
