// ==UserScript==
// @name         Travian - Only winners
// @namespace    http://tampermonkey.net/
// @version      1.3.1
// @description  Extras para a lista de farms do Travian.
// @author       Daniel Oliveira
// @match        https://*.travian.com/*
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://cdn.jsdelivr.net/npm/redux@4.0.5/dist/redux.min.js
// @require      https://cdn.jsdelivr.net/npm/moment@2.24.0/min/moment.min.js
// @require      https://cdn.jsdelivr.net/npm/moment@2.24.0/locale/pt.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_getTab
// @grant        GM_saveTab
// ==/UserScript==

const BUILDINGS = {
    BARRACKS: 19,
    RALLY_POINT: 16,
};

moment.locale('pt');

let log = (text) => console.log(text);

const time = () => {
    return parseInt(new Date().getTime() / 1000);
};

const get_crop = () => {
    return isNaN(parseInt($("#l4").text().replace(" ", ""))) ? 0 : parseInt($("#l4").text().replace(" ", ""));
};

const get_barracks_time = () => {
    return isNaN(parseInt($(".under_progress tbody tr:nth-last-child(2) span.timer").attr("value"))) ? 0 : parseInt($(".under_progress tbody tr:nth-last-child(2) span.timer").attr("value"));
};

const do_barracks_troops = (desiredQuantity) => {
    let quantity = Math.min(get_barracks_max_troops(), desiredQuantity);
    $("#favouriteTroops .cta input").first().val(quantity);
    $("#favouriteTroops .cta input").first().closest("form").submit();
};

const get_barracks_max_troops = () => {
    return isNaN(parseInt($("#favouriteTroops .cta a").first().text())) ? 0 : parseInt($("#favouriteTroops .cta a").first().text());
};

const set_barracks_troops = () => {
    return isNaN(parseInt($("#favouriteTroops .cta a").first().text())) ? 0 : parseInt($("#favouriteTroops .cta a").first().text());
};

const run = async (store) => {
    let farmLists = store.getState().settings.farmLists;
    let barracks = store.getState().settings.barracks;
    let tasks = store.getState().settings.tasks;
    var worked = false;

    await sleep(random_int(0, 3000));

    //FIXME random order

    // Check farm lists
    if (tasks.checkedFarmLists == false) {
        let listsArr = Object.values(farmLists);
        for (var i = 0; i < listsArr.length; i++) {
            let list = listsArr[i];
            if (list.enabled && list.lastSent + list.minInterval <= time()) {
                if (store.getState().state.page != FARM_LIST_PAGE) {
                    worked = true;
                    return go_to_page(FARM_LIST_PAGE);
                }
                ;
                log("A enviar lista " + list.name);
                store.dispatch({type: "SENT_FARM_LIST", payload: list});
                await send_farm_list(list);
                worked = true;
                return;
            }
        }

        if (worked == false) {
            store.dispatch({type: "CHECKED_FARM_LISTS"});
        } else {
            return;
        }
    }

    // Check barracks troops
    if (tasks.checkedBarracks == false) {
        if (barracks.maxQuantity > 0 && barracks.minCrop < get_crop()) {
            if (store.getState().state.page != BARRACKS_PAGE) {
                worked = true;
                return go_to_page(BARRACKS_PAGE);
            }
            ;

            if (get_barracks_time() <= barracks.minQueueTime && get_barracks_max_troops() > 0) {
                let quantity = Math.min(get_barracks_max_troops(), barracks.maxQuantity);
                if (quantity > 0) {
                    log("A fazer " + quantity + " tropas.")
                    do_barracks_troops(quantity);
                } else {
                    log("Sem recursos para fazer tropas.");
                }
            }
            ;

            store.dispatch({type: "CHECKED_BARRACKS"});
            worked = true;
            return;
        } else {
            if (barracks.minCrop > get_crop()) {
                log("Pouco cereal. Saltar verificação de quartel.");
            }
        }
    }

    // Return to dorf2
    if (store.getState().state.page != DORF2_PAGE) {
        worked = true;
        return go_to_page(DORF2_PAGE);
    }
    ;

    if (worked) {
        return true;
    }

    log("Sem tarefas. Tempo para uma pausa...");
    store.dispatch({type: "WORK_FINISHED"});
    return false;
};

function random_int(min, max) { // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

// Send farm list utils
function select_green_farms(farmList) {
    var $tableRows = $("#" + farmList.id).find(".raidListContent table tr.slotRow");
    for (var index = 0; index < $tableRows.get().length; index++) {
        var $row = $($tableRows.get(index));
        if ($row.find(".lastRaid img.iReport.iReport1").length >= 1 && !$row.find(".lastRaid img.iReport.iReport1").is(":checked")) {
            $row.find(".checkbox input.markSlot").click();
        }
    }
}

function select_yellow_farms(farmList) {
    var $tableRows = $("#" + farmList.id).find(".raidListContent table tr.slotRow");
    for (var index = 0; index < $tableRows.get().length; index++) {
        var $row = $($tableRows.get(index));
        if ($row.find(".lastRaid img.iReport.iReport2").length >= 1 && !$row.find(".lastRaid img.iReport.iReport2").is(":checked")) {
            $row.find(".checkbox input.markSlot").click();
        }
    }
}

function select_red_farms(farmList) {
    var $tableRows = $("#" + farmList.id).find(".raidListContent table tr.slotRow");
    for (var index = 0; index < $tableRows.get().length; index++) {
        var $row = $($tableRows.get(index));
        if ($row.find(".lastRaid img.iReport.iReport3").length >= 1 && !$row.find(".lastRaid img.iReport.iReport3").is(":checked")) {
            $row.find(".checkbox input.markSlot").click();
        }
    }
}

function select_not_visited_farms(farmList) {
    var $tableRows = $("#" + farmList.id).find(".raidListContent table tr.slotRow");
    for (var index = 0; index < $tableRows.get().length; index++) {
        var $row = $($tableRows.get(index));
        if ($row.find(".lastRaid img.iReport").length == 0 && !$row.find(".lastRaid img.iReport.iReport1").is(":checked")) {
            $row.find(".checkbox input.markSlot").click();
        }
    }
}

function select_all_farms(farmList) {
    var $allCheckBox = $("#" + farmList.id).find("input[type=checkbox].markAll");
    $allCheckBox.click();
}

async function open_farm_list(farmList) {
    let $farmList = $("#" + farmList.id);
    let collapsed = $farmList.find(".expandCollapse").hasClass("collapsed");
    if (!collapsed) return;

    $farmList.find(".expandCollapse").click();

    while (collapsed) {
        await sleep(100);
        collapsed = $farmList.find(".expandCollapse").hasClass("collapsed");
    }

    // Wait some time after the farm list is opened. Pretending to be a human
    await sleep(random_int(2000, 3500))
}

const send_farm_list = async (farmList) => {
    await open_farm_list(farmList);
    if (!farmList.attackNoInfo && !farmList.attackGreen && !farmList.attackYellow && !farmList.attackRed) {
        select_all_farms(farmList);
    }
    if (farmList.attackNoInfo) {
        select_not_visited_farms(farmList);
    }
    if (farmList.attackGreen) {
        select_green_farms(farmList)
    }
    if (farmList.attackYellow) {
        select_yellow_farms(farmList)
    }
    if (farmList.attackRed) {
        select_red_farms(farmList)
    }

    $("#" + farmList.id).find(".raidListContent .buttonWrapper button[type=submit].startButton").click();
}

const save = async (name, value) => {
    if (typeof GM_setValue == "function") {
        GM_setValue(name, value);
    } else {
        await GM.setValue(name, value);
    }
}

const load = async (name) => {
    if (typeof GM_setValue == "function") {
        return GM_getValue(name);
    }
    return await GM.getValue(name);
};

const save_tab = async (data) => {
    GM_saveTab(data);
};

const load_tab = async () => {
    return new Promise((resolutionFunc, rejectionFunc) => {
        GM_getTab((o) => {
            resolutionFunc(o);
        });
    });
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const update_interface = (state) => {
    let $elem = $("#travian-farm-plus").length > 0 ? $("#travian-farm-plus") : $("body").prepend(`<div id="travian-farm-plus" style="background-color: white; position: absolute; top: 0; left: 0; z-index: 99999; padding: 12px;"></div>`).find("#travian-farm-plus");
    $elem.html("");
    if (state.settings.hide) {
        $elem.append(`<button class="toggle-hide green textButtonV1" style="margin: -12px;">+</button>`);
    } else {
        $elem.append(`
            <button class="toggle-hide green textButtonV1" style="margin-left: auto;display: block;">Fechar</button>
            <h1 style="color: #F88C1F;">Travian só para vencedores</h1>
            <p><strong>Ligado: </strong>${state.tab.running ? "Sim" : "Não"}</p>
            <input type="number" class="min-pause" min="1" value="${state.settings.minPauseTime / 60}" /> Tempo mínimo de pausa<br />
            <input type="number" class="max-pause" min="1" value="${state.settings.maxPauseTime / 60}"/> Tempo máximo de pausa<br />
            <br />
            <button class="toggle-run green textButtonV1">${state.tab.running ? "Desligar" : "Ligar"}</button>
            <button class="run-now green textButtonV1">Trabalhar já</button>
            <p>Próxima acção ${moment.unix(state.settings.lastActivityTime + state.settings.pauseTime).fromNow()}</p>
            <hr />
            <h4>Listas de farms - <a href="/build.php?tt=99&id=39">Procurar novas listas</a></h4>
            ${Object.values(state.settings.farmLists).map(list => `
            <h3 style="${list.enabled ? "color:green" : "color:red"}">${list.name}</h3>
            <input type="checkbox" class="toggle-list-bool" prop="attackNoInfo" list-id="${list.id}" ${list.attackNoInfo ? "checked" : ""}/> <span style="color:blue">Sem informação?</span>
            <input type="checkbox" class="toggle-list-bool" prop="attackGreen" list-id="${list.id}" ${list.attackGreen ? "checked" : ""}/> <span style="color:green">Verdes?</span>
            <input type="checkbox" class="toggle-list-bool" prop="attackYellow"" list-id="${list.id}" ${list.attackYellow ? "checked" : ""}/> <span style="color:#afa01a">Amarelos?</span>
            <input type="checkbox" class="toggle-list-bool" prop="attackRed" list-id="${list.id}" ${list.attackRed ? "checked" : ""}/> <span style="color:red">Vermelhos?</span><br />
            <input type="number" class="list-min-interval" min="5" list-id="${list.id}" value="${list.minInterval / 60}"/> Tempo mínimo de espera
            <br />
            <p>Enviada ${moment.unix(list.lastSent).fromNow()}. Próximo envio ${moment.unix(Math.max(list.lastSent + list.minInterval, state.settings.lastActivityTime + state.settings.pauseTime)).fromNow()}</p>
            <button class="toggle-list green textButtonV1" list-id="${list.id}">${list.enabled ? "Desactivar" : "Activar"}</button>
            `).join('')}
            <hr />
            <h4>Quartel</h4>
            Fazer até <input type="number" class="barracks-quantity" min="0" value="${state.settings.barracks.maxQuantity}"/> tropas <br />
            se a fila for menor que <input type="number" class="barracks-min-queue" min="0" value="${state.settings.barracks.minQueueTime / 60}"/> minutos<br />
            e o celeiro tiver mais do que <input type="number" class="barracks-min-crop" min="0" value="${state.settings.barracks.minCrop}"/> cereal.<br />
            <strong>No quartel colocar a tropa desejada como favorita.</strong>
            <hr />
            <h4>Actividade</h4>
            <div style="max-height: 128px; overflow-y: scroll;">
            ${state.settings.logs.map(log => `<p style="margin-bottom: 2px; margin-top: 0;">${moment.unix(log.time).format('DD/MMMM, HH:mm:ss')} - ${log.log}</p>`).join('')}
            </div>
        `);
    }

    if (state.state.timeToNextRun > 0) {
        $("title").text($("title").text().split(" - ")[0] + " - " + state.state.timeToNextRun + "s");
    }
};

const click_building = (gid) => {
    return $(".buildingSlot.g" + gid + " .clickShape path").click();
};

const get_current_page = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const file = window.location.pathname.replace("/", "");

    switch (file) {
        case 'build.php':
            if (urlParams.get('tt') == "99" && (urlParams.get('id') == "39" || urlParams.get("gid") == "16")) {
                return FARM_LIST_PAGE;
            }
            if (urlParams.get('id') == "39" || urlParams.get("gid") == "16") {
                return RALLY_POINT_PAGE;
            }
            if ($("#build.gid" + BUILDINGS.BARRACKS).length > 0) {
                return BARRACKS_PAGE;
            }
        case 'dorf2.php':
            return DORF2_PAGE;
        default:
            return null;
    }
};

const go_to_page = (page) => {
    if (page == RALLY_POINT_PAGE) {
        if (get_current_page() != DORF2_PAGE) {
            return go_to_page(DORF2_PAGE);
        }
        log("A ir para o PRM.");
        click_building(BUILDINGS.RALLY_POINT);
    }
    if (page == FARM_LIST_PAGE) {
        if (get_current_page() != RALLY_POINT_PAGE) {
            return go_to_page(RALLY_POINT_PAGE);
        }
        log("A ir para a lista de farms.");
        window.location.href = window.location.origin + "/build.php?tt=99&id=39";
    }
    if (page == BARRACKS_PAGE) {
        if (get_current_page() != DORF2_PAGE) {
            return go_to_page(DORF2_PAGE);
        }
        log("A ir para o quartel.");
        click_building(BUILDINGS.BARRACKS);
    }
    if (page == DORF2_PAGE) {
        log("A ir para o centro da aldeia.");
        window.location.href = window.location.origin + "/dorf2.php";
    }
};

const slugify = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

const get_farm_lists = () => {
    $farmLists = $("#raidList .raidList");
    farmLists = {};
    $farmLists.each(function (index, elem) {
        let id = $(elem).attr("id");
        let name = $(elem).closest(".villageWrapper").find('.villageName').text().trim() + " - " + $(elem).find(".listName .value").text().trim(); // Village name + farm list name
        farmLists[id] = {
            id: id,
            enabled: false,
            slug: slugify(name),
            name: name,
            lastSent: 0,
            minInterval: 60 * 60,
            attackNoInfo: false,
            attackGreen: true,
            attackYellow: false,
            attackRed: false,
        };
    });
    return farmLists;
};

// Initial states
const SETTINGS_INITIAL_STATE = {
    farmLists: {},
    barracks: {
        maxQuantity: 0,
        minQueueTime: 0,
        minCrop: 1000,
    },
    logs: [],
    tasks: {
        checkedFarmLists: false,
        checkedBarracks: false,
    },
    minPauseTime: 50 * 60,
    maxPauseTime: 70 * 60,
    lastActivityTime: 0,
    pauseTime: 60 * 60,
    hide: false,
};

const TAB_INITIAL_STATE = {
    running: false,
};

const STATE_INITIAL_STATE = {
    page: null,
    timeToNextRun: 0,
};

// Relevant pages
const FARM_LIST_PAGE = "FARM_LIST_PAGE";
const BARRACKS_PAGE = "BARRACKS_PAGE";
const DORF2_PAGE = "DORF2_PAGE";
const RALLY_POINT_PAGE = "RALLY_POINT_PAGE";

(async function () {
    let Redux = window.Redux;
    let loop = null;

    /* REDUCERS */
    let settingsReducer = (state = SETTINGS_INITIAL_STATE, action) => {
        switch (action.type) {
            case 'LOAD_SETTINGS':
                return {...state, ...action.payload};
            case 'CHECKED_FARM_LISTS':
                return {...state, tasks: {...state.tasks, checkedFarmLists: true}};
            case 'ADD_LOG':
                let maxLogs = 50;
                let logs = state.logs;
                logs.unshift({
                    time: time(),
                    log: action.payload,
                });
                logs = logs.slice(0, maxLogs);
                return {...state, logs};
            case 'TOGGLE_HIDE':
                return {...state, hide: !state.hide};
            case 'CHECKED_BARRACKS':
                return {...state, tasks: {...state.tasks, checkedBarracks: true}};
            case 'SET_BARRACKS_MIN_QUEUE_TIME':
                return {...state, barracks: {...state.barracks, minQueueTime: action.payload}};
            case 'SET_BARRACKS_MAX_QUANTITY':
                return {...state, barracks: {...state.barracks, maxQuantity: action.payload}};
            case 'SET_BARRACKS_MIN_CROP':
                return {...state, barracks: {...state.barracks, minCrop: action.payload}};
            case 'WORK_FINISHED':
                return {
                    ...state,
                    lastActivityTime: time(),
                    pauseTime: random_int(state.minPauseTime, state.maxPauseTime),
                    tasks: {
                        ...state.tasks,
                        checkedFarmLists: false,
                        checkedBarracks: false
                    }
                }
            case 'ADD_FARM_LIST':
                return {...state, farmLists: {...state.farmLists, [action.payload.id]: action.payload}};
            case 'REMOVE_FARM_LIST':
                let farmLists = state.farmLists;
                delete farmLists[action.payload.id];
                return {...state, farmLists};
            case 'SET_FARM_LIST_PROP':
                state.farmLists[action.payload.id][action.payload.prop] = !state.farmLists[action.payload.id][action.payload.prop]
                return {...state};
            case 'SET_FARM_LIST_MIN_INTERVAL':
                state.farmLists[action.payload.id].minInterval = action.payload.value;
                return {...state};
            case 'SENT_FARM_LIST':
                state.farmLists[action.payload.id].lastSent = time();
                return {...state};
            case 'TOGGLE_FARM_LIST':
                state.farmLists[action.payload].enabled = !state.farmLists[action.payload].enabled
                return {...state};
            case 'RESET_ACTIVITY_TIMER':
                return {...state, lastActivityTime: 0};
            case 'SET_MIN_PAUSE':
                let maxPauseTime = state.maxPauseTime;
                if (action.payload <= 60) {
                    action.payload = 60
                }
                if (action.payload >= maxPauseTime - 60) {
                    maxPauseTime = action.payload + 60;
                }
                return {...state, minPauseTime: action.payload, maxPauseTime};
            case 'SET_MAX_PAUSE':
                let pauseTime = state.pauseTime;
                if (action.payload <= state.minPauseTime + 60) {
                    action.payload = state.minPauseTime + 60
                }
                if (pauseTime > action.payload) {
                    pauseTime = action.payload;
                }
                return {...state, maxPauseTime: action.payload, pauseTime};
            default:
                return state;
        }

    };

    let stateReducer = (state = STATE_INITIAL_STATE, action) => {
        switch (action.type) {
            case 'SET_PAGE':
                return {...state, page: action.payload};
            case 'SET_TIME_TO_NEXT_RUN':
                return {...state, timeToNextRun: action.payload};
            default:
                return state;
        }

    };

    let tabReducer = (state = TAB_INITIAL_STATE, action) => {
        switch (action.type) {
            case 'LOAD_TAB':
                return {...state, ...action.payload};
            case 'RUN':
                return {...state, running: action.payload};
            default:
                return state;
        }

    };
    let rootReducer = Redux.combineReducers({settings: settingsReducer, tab: tabReducer, state: stateReducer});
    let store = Redux.createStore(rootReducer);

    // Override the log function
    log = ((store) => (text) => {
        store.dispatch({type: 'ADD_LOG', payload: text});
    })(store);

    // Update interface
    store.subscribe(() => {
        let state = store.getState();
        update_interface(state);
    });

    // Load settings and tab settings
    let settings = await load("settings");
    store.dispatch({type: 'LOAD_SETTINGS', payload: settings});
    let tab = await load_tab();
    store.dispatch({type: 'LOAD_TAB', payload: tab});

    // Subscribe running state
    const checkRun = async () => {
        let state = store.getState();
        if (state.settings.lastActivityTime + state.settings.pauseTime <= time()) {
            await run(store);
        }
        store.dispatch({
            type: "SET_TIME_TO_NEXT_RUN",
            payload: state.settings.pauseTime + state.settings.lastActivityTime - time()
        });
        loop = setTimeout(checkRun, random_int(3500, 5000));
    };
    store.subscribe(() => {
        if (store.getState().tab.running && !loop) {
            loop = setTimeout(checkRun, random_int(3500, 5000));
        } else if (!store.getState().tab.running && loop) {
            loop = clearTimeout(loop);
        }
    });

    // Save settings and tab settings listener
    store.subscribe(() => {
        let state = store.getState();
        save('settings', state.settings);
        save_tab(state.tab);
    });

    // Finds current page
    store.dispatch({type: 'SET_PAGE', payload: get_current_page()});


    // Interface event listeners
    $(document).on("click", ".toggle-hide", async () => {
        store.dispatch({type: 'TOGGLE_HIDE'});
    });

    $(document).on("click", ".toggle-run", async () => {
        store.dispatch({type: 'RUN', payload: !store.getState().tab.running});
    });

    $(document).on("click", ".run-now", async () => {
        store.dispatch({type: 'RESET_ACTIVITY_TIMER'});
    });

    $(document).on("click", ".toggle-list", async (e) => {
        store.dispatch({type: 'TOGGLE_FARM_LIST', payload: $(e.target).attr("list-id")});
    });

    $(document).on("change", ".min-pause", async (e) => {
        store.dispatch({
            type: 'SET_MIN_PAUSE',
            payload: isNaN(parseInt($(e.target).val())) ? 50 * 60 : parseInt($(e.target).val()) * 60
        });
    });

    $(document).on("change", ".max-pause", async (e) => {
        store.dispatch({
            type: 'SET_MAX_PAUSE',
            payload: isNaN(parseInt($(e.target).val())) ? 50 * 60 : parseInt($(e.target).val()) * 60
        });
    });

    $(document).on("click", ".toggle-list-bool", async (e) => {
        let id = $(e.target).attr("list-id");
        let prop = $(e.target).attr("prop");
        let value = !store.getState().settings.farmLists[id][prop];
        store.dispatch({type: 'SET_FARM_LIST_PROP', payload: {id, prop, value}});
    });

    $(document).on("change", ".list-min-interval", async (e) => {
        let id = $(e.target).attr("list-id");
        let value = isNaN(parseInt($(e.target).val())) ? 60 : parseInt($(e.target).val()) * 60;
        store.dispatch({type: 'SET_FARM_LIST_MIN_INTERVAL', payload: {id, value}});
    });

    $(document).on("change", ".barracks-quantity", async (e) => {
        let value = isNaN(parseInt($(e.target).val())) ? 0 : parseInt($(e.target).val());
        store.dispatch({type: 'SET_BARRACKS_MAX_QUANTITY', payload: value});
    });

    $(document).on("change", ".barracks-min-crop", async (e) => {
        let value = isNaN(parseInt($(e.target).val())) ? 0 : parseInt($(e.target).val());
        store.dispatch({type: 'SET_BARRACKS_MIN_CROP', payload: value});
    });

    $(document).on("change", ".barracks-min-queue", async (e) => {
        let value = isNaN(parseInt($(e.target).val())) ? 60 : parseInt($(e.target).val()) * 60;
        store.dispatch({type: 'SET_BARRACKS_MIN_QUEUE_TIME', payload: value});
    });


    // Page specific actions
    if (store.getState().state.page == FARM_LIST_PAGE) {
        let farmLists = get_farm_lists();
        let stateLists = store.getState().settings.farmLists;

        // Add new farm lists
        Object.values(farmLists).forEach((elem) => {
            if (typeof stateLists[elem.id] === "undefined") {
                store.dispatch({type: 'ADD_FARM_LIST', payload: elem});
            }
        });

        // Remove non existent farm lists
        Object.values(stateLists).forEach((elem) => {
            if (typeof farmLists[elem.id] === "undefined") {
                store.dispatch({type: 'REMOVE_FARM_LIST', payload: elem});
            }
        });

    }
})();
