(() => {
    // region Getting Modules
    const modules = {};
    const imodules = {};
    const routes = {};
    const refs = [];
    function ref(module, callback, order=0) {
        // TODO: Сделать `order` чтобы некоторые ссылки загружались раньше остальных
        // if (refs[module] !== undefined) console.warn(`Ref for \`${module}\` exists, be pretty accurate!`);
        refs.push([module, callback]);
    }
    const pfc = Function.prototype.call;
    Function.prototype.call = function(...e) {
        pfc.apply(this, e);
        let exports = e[2];
        if (exports !== undefined && exports.__esModule === true) {
            let emodules = Object.getOwnPropertyNames(exports);
            emodules.splice(emodules.indexOf('__esModule'), 1);
            emodules.forEach((emodule) => {
                refs.forEach(([module, callback]) => {
                    if (module === emodule) exports[emodule] = callback(exports[emodule]);
                });
                modules[emodule] = exports[emodule];
            });
        }
    }
    // endregion
    // region Routes
    routes.ChunkUpdates = new class ChunkUpdatesRoute {
        toLast(arrow) {
            fapi.modules.ChunkUpdates.toLast(arrow);
        }
        updateCount(fromArrow, arrow, add=1) {
            fapi.modules.ChunkUpdates.updateCount(fromArrow, arrow, add);
        }
        blockSignal(arrow) {
            fapi.modules.ChunkUpdates.blockSignal(arrow);
        }
        getArrowAt(chunk, x, y, rotation, flipped, distance=-1, diagonal=0) {
            return fapi.modules.ChunkUpdates.getArrowAt(chunk, x, y, rotation, flipped, distance, diagonal);
        }
        sgetArrowAt(arrow, distance=-1, diagonal=0) {
            return fapi.modules.ChunkUpdates.sgetArrowAt(arrow, distance, diagonal);
        }
        update(gameMap) {
            fapi.modules.ChunkUpdates.update(gameMap);
        }
        clearSignals(gameMap) {
            fapi.modules.ChunkUpdates.clearSignals(gameMap);
        }
        wasArrowChanged(arrow) {
            return fapi.modules.ChunkUpdates.wasArrowChanged(arrow);
        }
    }
    // endregion
    // region Utilities
    function obtainSpreadsheetData(sheetId, gid) {
        const url = 'https://docs.google.com/spreadsheets/d/e/' + sheetId + '/pub?gid=' + gid + '&single=true&output=tsv';
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, false)
        xhr.send();
        return xhr.responseText;
    }
    function obtainModManifest(url) {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", prettifyModUrl(url), false);
            xhr.send();
            const json = JSON.parse(xhr.responseText);
            if (json.name === undefined) json.name = 'Неизвестный';
            if (json.author === undefined) json.author = 'Неизвестный';
            if (json.icon === undefined) json.icon = 'Unknown';
            if (json.description === undefined) json.description = 'Описания нету';
            if (json.dependencies === undefined) json.dependencies = [];

            if (json.id === undefined) return 1;
            else if (json.script === undefined) return 1;
            else if (json.xdlcversion === undefined) return 1;
            return json;
        } catch {
            return undefined;
        }
    }
    /*
        0 - Успешно получен
        1 - Ошибка
     */
    function prettifyModUrl(path) {
        if (path.includes('githubusercontent')) return path;
        else return path.replace('github', 'raw.githubusercontent').replace('blob/', '');
    }
    // endregion
    // region Classes
    class FMod {
        constructor(id, idname) {
            let regex = /^[a-z._]+$/;
            if (!regex.test(idname)) {
                throw new Error(`Incorrect id: ${idname}`);
            }
            this.id = id;
            this.idname = idname;
            this.arrows = {};
            this.showUI = () => undefined;
        }
        registerArrow(arrowId) {
            if (this.arrows[arrowId] !== undefined)
                throw new Error(`Arrow with id \`${arrowId}\` in mod \`${this.idname}\` already exists`);
            const arrow = new FModArrow();
            arrow.id = arrowId;
            fapi.ARROWS.push(arrow);
            arrow.type = fapi.ARROWS.length - 1;
            arrow.mod = this;
            this.arrows[arrowId] = arrow;
            return arrow;
        }
    }
    class ArrowHandler {
        constructor(update = () => undefined, transmit = () => undefined, block = () => undefined, draw = (arrow, index) => index) {
            this.update = update;
            this.transmit = transmit; // Вызывается после `update`
            this.block = block; // Вызывается после `transmit`
            this.draw = draw;
        }
    }
    class FModArrow extends ArrowHandler {
        constructor() {
            super();
            this.type = 0;
            this.id = 0;
            this.name = ["Unknown ( mod arrow )", "Unknown ( mod arrow )", "Unknown ( mod arrow )", "Unknown ( mod arrow )"]; // Как называется
            this.activation = ["Unknown ( mod arrow )", "Unknown ( mod arrow )", "Unknown ( mod arrow )", "Unknown ( mod arrow )"]; // Как активируется
            this.action = ["Unknown ( mod arrow )", "Unknown ( mod arrow )", "Unknown ( mod arrow )", "Unknown ( mod arrow )"]; // Куда передаёт сигнал
            this.mod = null;
            this.icon_url = ""; // Текстура стрелочки
            this.textures = undefined; // Текстуры стрелочки ( если `undefined` то берётся основная текстура )
            this.clickable = false; // Может ли стрелочка нажиматься
            this.pressable = false; // Может ли стрелочка зажиматься
            this.custom_data = [];
            this.TEXTURE_INDEX = 1;

            this.click = () => undefined; // Вызывается при нажатии на стрелочку
            this.press = () => undefined; // Вызывается при зажатии стрелочки
            this.save_cd = (arrow) => arrow.custom_data;
            this.load_cd = (custom_data) => custom_data;
        }
    }
    class FModPageContainer {
        constructor(isHorizontal=true, container=undefined) {
            this.containers = [];
            this.isHorizontal = isHorizontal;
            this.container = container;
            if (container !== undefined) this.setContainer(container);
        }

        setContainer(container) {
            this.container = container;
            container.style.display = 'flex';
            container.style.flexDirection = this.isHorizontal ? 'row' : 'column';
        }

        createContainer(size=100, isHorizontal=true) {
            const div = document.createElement('div');
            this.container.appendChild(div);
            this.containers.push([div, size]);
            this.updateContainers();
            return new FModPageContainer(isHorizontal, div);
        }

        createSpace(size=10) {
            const div = document.createElement('div');
            this.container.appendChild(div);
            this.containers.push([div, size]);
            this.updateContainers();
            return div;
        }

        createImage(src, size=100) {
            const img = document.createElement('img');
            img.src = src;
            this.container.appendChild(img);
            this.containers.push([img, size]);
            this.updateContainers();
            return img;
        }

        createText(text, size=100) {
            const txt = document.createElement('div');
            txt.style.fontFamily = 'var(--font)';
            txt.style.color = '#fff';
            txt.innerHTML = text;
            this.container.appendChild(txt);
            this.containers.push([txt, size]);
            this.updateContainers();
            return txt;
        }

        createInput(text, type, size=100) {
            const inp = document.createElement('input');
            inp.type = type;
            inp.style.fontFamily = 'var(--font)';
            inp.style.color = '#fff';
            inp.style.padding = '10px';
            inp.style.border = 'none';
            inp.style.borderRadius = '16px';
            inp.placeholder = text;
            this.container.appendChild(inp);
            this.containers.push([inp, size]);
            this.updateContainers();
            return inp;
        }

        createButton(text, size=100) {
            const btn = document.createElement('button');
            btn.style.fontFamily = 'var(--font)';
            btn.style.color = '#fff';
            btn.style.padding = '10px';
            btn.style.cursor = 'pointer';
            btn.style.border = 'none';
            btn.style.borderRadius = '16px';
            btn.textContent = text;
            this.container.appendChild(btn);
            this.containers.push([btn, size]);
            this.updateContainers();
            return btn;
        }

        // createCheckBox(size=100) {
        //     const checkbox = this.createInput(undefined, 'checkbox', size);
        //
        //     return checkbox;
        // }

        clear() {
            this.containers = [];
            this.container.innerHTML = '';
        }

        updateContainers() {
            let maxSize = 0;
            this.containers.forEach(([div, size]) => {
                if (typeof size === "number") maxSize += size;
            });
            this.containers.forEach(([div, size]) => {
                let value;
                if (typeof size === "number") value = `${(size / maxSize * 100)}%`;
                else value = size;
                if (this.isHorizontal) div.style.width = value;
                else div.style.height = value;
            });
        }
    }
    class FModPage extends FModPageContainer {
        constructor(idname, isHorizontal=true) {
            super(isHorizontal);
            let regex = /^[a-z._]+$/;
            if (!regex.test(idname)) throw new Error(`Incorrect id: ${idname}`);
            this.idname = idname;
            this.translates = ['Unknown', 'Unknown', 'Unknown', 'Unknown'];
            this.icon_url = 'https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/text_block.png';
            this.drawCallback = () => {console.log(`Need to drawn \`${this.idname}\` mod page`)};
            fapi.pages[this.idname] = this;
        }
        draw(element) {
            this.setContainer(element);
            this.drawCallback(element);
        }
        close() {
            this.clear();
        }
    }
    class FModal {
        constructor() {
            this.modal = document.createElement('dialog');
            this.modal.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
            this.modal.style.width = '100%';
            this.modal.style.height = '100%';
            this.modal.style.zIndex = '2';
            this.modal.style.border = 'none';
            this.modal.style.display = 'flex';
            this.modal.style.flexWrap = 'wrap';
            this.modal.style.alignContent = 'center';
            this.modal.style.justifyContent = 'center';
            this.content = document.createElement('div');
            this.content.style.backgroundColor = 'var(--light-blue)';
            this.content.style.padding = '10px';
            this.content.style.borderRadius = '15px';
            this.content.style.display = 'flex';
            this.content.style.flexDirection = 'column';
            this.content.style.gap = '10px';
            this.modal.appendChild(this.content);
            document.body.appendChild(this.modal);
            this.modal.show();
        }
        close() {
            this.modal.close();
            this.modal.remove();
        }
        createInput(label, placeholder, type='number') {
            const pair = document.createElement('div');
            pair.style.display = 'flex';
            const text = document.createElement('div');
            text.style.padding = '6px';
            text.style.fontFamily = 'var(--font)';
            text.style.fontSize = '18px';
            text.textContent = label;
            pair.appendChild(text);
            const input = document.createElement('input');
            input.style.border = 'none';
            input.style.backgroundColor = 'var(--background)';
            input.style.borderRadius = '8px';
            input.style.padding = '0 10px';
            input.style.fontFamily = 'var(--font)';
            input.style.fontSize = '18px';
            input.style.width = '-webkit-fill-available';
            input.style.color = '#fff';
            input.type = type;
            input.placeholder = placeholder;
            pair.appendChild(input);
            this.content.appendChild(pair);
            return input;
        };
        createTextArea(label, placeholder, width='350px', height='250px') {
            const pair = document.createElement('div');
            pair.style.display = 'flex';
            const text = document.createElement('div');
            text.style.padding = '6px';
            text.style.fontFamily = 'var(--font)';
            text.style.fontSize = '18px';
            text.style.lineHeight = 'auto';
            text.textContent = label;
            pair.appendChild(text);
            const input = document.createElement('textarea');
            input.style.border = 'none';
            input.style.backgroundColor = 'var(--background)';
            input.style.borderRadius = '8px';
            input.style.padding = '10px';
            input.style.resize = 'none';
            input.style.fontFamily = 'var(--font)';
            input.style.fontSize = '18px';
            input.style.width = '-webkit-fill-available';
            input.style.width = width;
            input.style.height = height;
            input.style.color = '#fff';
            input.placeholder = placeholder;
            pair.appendChild(input);
            this.content.appendChild(pair);
            return input;
        };
        createSelect(label, options) {
            const pair = document.createElement('div');
            pair.style.display = 'flex';
            const text = document.createElement('div');
            text.style.padding = '6px';
            text.style.fontFamily = 'var(--font)';
            text.style.fontSize = '18px';
            text.textContent = label;
            pair.appendChild(text);
            const select = document.createElement('select');
            select.style.border = 'none';
            select.style.backgroundColor = 'var(--background)';
            select.style.borderRadius = '8px';
            select.style.padding = '0 10px';
            select.style.fontFamily = 'var(--font)';
            select.style.fontSize = '18px';
            select.style.width = '-webkit-fill-available';
            select.style.color = '#fff';
            options.forEach((value) => {
                const option = document.createElement('option');
                option.style.color = '#fff';
                option.value = value;
                option.text = value;
                select.appendChild(option);
            });
            pair.appendChild(select);
            this.content.appendChild(pair);
            return select;
        };
    }
    class FAPI {
        constructor() {
            this.VERSION = 2;
            this.MAX_TEXTURE_INDEX = 25;
            this.BASIC_TYPES = 24;
            this.ID_SYMBOLS = 'abcdefghijklmnopqrstuvwxyz_.'.split('');
            this.modules = modules;
            this.imodules = imodules;
            this.routes = routes;
            this.experimental = {
                autoRotateArrow: false, // Вращать стрелочку при постановке
                updateLevelArrow: true, // Обновление сигнала стрелочки из уровня
            }
            this.mods = [];
            this.pages = {};
            // region ARROW HANDLERS
            this.ARROWS = [];
            this.ARROWS.push(new ArrowHandler(
                () => undefined,
                (arrow) => arrow.signalsCount = 0,
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 1 : 0,
                (arrow) => {
                    if (arrow.signal === 1) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = 1,
                (arrow) => {
                    if (arrow.signal === 1) {
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 1, 0));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, 1));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 0));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, -1));
                    }
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 1 : 0,
                () => undefined,
                (arrow) => {
                    if (arrow.lastSignal === 1) routes.ChunkUpdates.blockSignal(routes.ChunkUpdates.sgetArrowAt(arrow));
                },
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => {
                    if (arrow.signal === 2) arrow.signal = 1;
                    else if (arrow.signalsCount > 0) {
                        if (arrow.signal === 0) arrow.signal = 2;
                        else if (arrow.signal === 1) arrow.signal = 1;
                    }
                    else arrow.signal = 0;
                },
                (arrow) => {
                    if (arrow.signal === 1) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => {
                    arrow.signal = 0;
                    const backward_arrow = routes.ChunkUpdates.sgetArrowAt(arrow, 1);
                    if (backward_arrow !== undefined) arrow.signal = backward_arrow.lastSignal !== 0 ? 1 : 0;
                },
                (arrow) => {
                    if (arrow.signal === 1) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 1 : 0,
                (arrow) => {
                    if (arrow.signal === 1) {
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 0));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 1, 0));
                    }
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 1 : 0,
                (arrow) => {
                    if (arrow.signal === 1) {
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 0));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, 1));
                    }
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 1 : 0,
                (arrow) => {
                    if (arrow.signal === 1) {
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 0));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, 1));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, -1));
                    }
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => {
                    if (arrow.signal === 0) arrow.signal = 1;
                    else if (arrow.signal === 1) arrow.signal = 2;
                },
                (arrow) => {
                    if (arrow.signal === 1) {
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 1, 0));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, 1));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 0));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, -1));
                    }
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 2 : 0,
                (arrow) => {
                    if (arrow.signal === 2) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -2));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 2 : 0,
                (arrow) => {
                    if (arrow.signal === 2) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 1));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 2 : 0,
                (arrow) => {
                    if (arrow.signal === 2) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 0));
                    if (arrow.signal === 2) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -2, 0));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 2 : 0,
                (arrow) => {
                    if (arrow.signal === 2) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -2, 0));
                    if (arrow.signal === 2) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, 1));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 2 : 0,
                (arrow) => {
                    if (arrow.signal === 2) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 0));
                    if (arrow.signal === 2) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 1));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 0 : 3,
                (arrow) => {
                    if (arrow.signal === 3) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 1 ? 3 : 0,
                (arrow) => {
                    if (arrow.signal === 3) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount % 2 === 1 ? 3 : 0,
                (arrow) => {
                    if (arrow.signal === 3) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => {
                    if (arrow.signalsCount > 1) arrow.signal = 3;
                    else if (arrow.signalsCount === 1) arrow.signal = 0;
                },
                (arrow) => {
                    if (arrow.signal === 3) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => {
                    if (arrow.signalsCount > 0) arrow.signal = arrow.signal === 3 ? 0 : 3;
                },
                (arrow) => {
                    if (arrow.signal === 3) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = (arrow.signalsCount > 0 && Math.random() < 0.5) ? 5 : 0,
                (arrow) => {
                    if (arrow.signal === 5) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = 0,
                (arrow) => {
                    if (arrow.signal === 5) {
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 1, 0));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, 1));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, -1, 0));
                        routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow, 0, -1));
                    }
                }
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => {
                    arrow.signal = arrow.signalsCount > 0 ? 1 : 0;
                    const n = arrow.chunk.getLevelArrow(arrow.x, arrow.y);
                    if (n !== undefined) n.update();
                },
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 1 : 0,
            ));
            this.ARROWS.push(new ArrowHandler(
                (arrow) => arrow.signal = arrow.signalsCount > 0 ? 5 : 0,
                (arrow) => {
                    if (arrow.signal === 5) routes.ChunkUpdates.updateCount(arrow, routes.ChunkUpdates.sgetArrowAt(arrow));
                }
            ));
            // endregion
        }
        /**
         * @param {number} type Айди стрелочки
         * @return {FModArrow} Стрелочка из мода ( FModArrow )
         */
        getArrowByType = function(type) {
            let arrow;
            this.mods.forEach((fmod) => {
                Object.values(fmod.arrows).forEach((farrow) => {
                    if (farrow.type === type) arrow = farrow;
                });
            });
            return arrow;
        }
        getModByIdName = function(idname) {
            let mod;
            this.mods.forEach((fmod) => {
                if (fmod.idname === idname) mod = fmod;
            });
            return mod;
        }
        registerMod(idname) {
            let mod = new FMod();
            mod.id = this.mods.length;
            mod.name = name;
            mod.idname = idname;
            this.mods.push(mod);
            console.log(`Mod \`${idname}\` registered`)
            return mod;
        }
    }
    // endregion
    // region Instantiate FAPI
    let fapi = new FAPI();
    window.fapi = fapi;
    window.ref = ref;
    // endregion
    // region UI Classes
    new class XDLCPage extends FModPage {
        constructor() {
            super('x_dlc.main');
            this.translates = ['Mods', 'Моды', 'Моды', 'Моды']
            this.drawCallback = () => undefined;
            this.modsInfo = [];
        }
        draw(element) {
            super.draw(element);
            this.createSpace("100px");
            this.modsContainer = this.createContainer(20, false);
            this.modsContainer.container.style.backgroundColor = 'var(--norm-blue)';
            this.modsContainer.createSpace('50px');
            this.createSpace("50px");
            this.infoContainer = this.createContainer(40, false);
            this.infoContainer.container.style.backgroundColor = 'var(--norm-blue)';
            this.createSpace("100px");
            this.xdlcContainer = this.createContainer(30, false);
            this.xdlcContainer.container.style.backgroundColor = 'var(--norm-blue)';
            this.createSpace("100px");
            this.modsInfo = [];
            Object.keys(loadResults).forEach((id) => this.drawMod(loadResults[id]));
            this.jsonContainer = this.xdlcContainer.createContainer('50px', true);
            this.jsonContainer.container.style.padding = '10px';
            this.jsonInput = this.jsonContainer.createInput('Ссылка на `.json` файл', 'text');
            this.jsonInput.style.fontSize = '16px';
            this.jsonInput.style.backgroundColor = 'var(--blue)';
            this.jsonContainer.createSpace('25px');
            this.loadBtn = this.jsonContainer.createButton('Загрузить', '150px');
            this.loadBtn.style.fontSize = '16px';
            this.loadBtn.style.backgroundColor = 'var(--light-green)';
            this.loadBtn.onclick = () => {
                if (this.jsonInput.value === '') return;
                const manifest = obtainModManifest(this.jsonInput.value);
                if (manifest === undefined) {
                    this.loadBtn.style.backgroundColor = 'var(--light-red)';
                    this.loadBtn.textContent = 'Ошибка';
                    setTimeout(() => {
                        this.loadBtn.style.backgroundColor = 'var(--light-green)';
                        this.loadBtn.textContent = 'Загрузить';
                    }, 250);
                    return;
                }
                else if (loadResults[manifest.id] !== undefined) {
                    this.loadBtn.style.backgroundColor = 'var(--light-blue)';
                    this.loadBtn.textContent = 'Уже установлен';
                    setTimeout(() => {
                        this.loadBtn.style.backgroundColor = 'var(--light-green)';
                        this.loadBtn.textContent = 'Загрузить';
                    }, 250);
                    return;
                }
                loadResults[manifest.id] = {'manifest': manifest, 'code': 5};
                this.drawMod(loadResults[manifest.id]);
                modsToLoad.push([true, prettifyModUrl(this.jsonInput.value)]);
                localStorage.setItem('mods', JSON.stringify(modsToLoad));
            }
            // this.experimentalAutoRotate = this.xdlcContainer.createContainer('50px', true);
            // this.experimentalAutoRotate.container.style.padding = '10px';
            // this.autoRotateLabel = this.experimentalAutoRotate.createText('Авто поворот стрелочки', '100%');
            // this.autoRotateLabel.style.width = '50px';
            // this.experimentalAutoRotate.createSpace('25px');
            // this.autoRotateCheckbox = this.experimentalAutoRotate.createCheckBox('Ссылка на `.json` файл', 'text');
            // this.autoRotateCheckbox.style.fontSize = '16px';
            // this.autoRotateCheckbox.style.backgroundColor = 'var(--blue)';
        }
        drawMod(loadResult) {
            const mod = loadResult.manifest;
            const code = loadResult.code;
            const error = loadResult.error;
            const not_founded = loadResult.not_founded;

            const modContainer = this.modsContainer.createContainer("100px", true);
            modContainer.container.style.backgroundColor = 'var(--blue)';
            modContainer.container.style.boxSizing = 'border-box';
            modContainer.container.style.padding = '10px';
            modContainer.container.style.marginBottom = '15px';
            modContainer.container.style.cursor = 'pointer';
            modContainer.container.onclick = () => {
                if (this.selectedMod === mod.id || loadResults[mod.id].code === 7) return;
                this.selectedMod = mod.id;
                this.updateSelectedMods()
                this.showModInfo(loadResult);
            }
            const image = modContainer.createImage(mod.icon, '80px');
            image.style.backgroundColor = 'var(--background)';
            image.style.borderRadius = '20px';
            const nameContainer = modContainer.createContainer('100%', false);
            nameContainer.container.style.padding = '10px';
            const name = nameContainer.createText(mod.name, 50);
            name.style.fontWeight = '700';
            name.style.fontSize = '22px';
            name.style.color = '#fff';
            let statusText = '';
            let statusColor = '';
            if (code === 1) {
                statusText = 'Загружен!';
                statusColor = 'var(--light-green)';
            } else if (code === 5) {
                statusText = 'Требуется перезагрузка';
                statusColor = 'var(--light-blue)';
            } else if (code === 0) {
                statusText = 'Мод не найден';
                statusColor = 'var(--light-red)';
            } else if (code === 2) {
                statusText = 'Произошла ошибка';
                statusColor = 'var(--light-red)';
            } else if (code === 4) {
                statusText = 'Не найдены зависимости';
                statusColor = 'var(--light-red)';
            } else if (code === 3) {
                statusText = 'Циклические зависимости';
                statusColor = 'var(--light-red)';
            } else if (code === 6) {
                statusText = 'Сделан на старом `X-DLC`';
                statusColor = 'var(--light-red)';
            } else if (code === 7) {
                statusText = 'Удалён';
                statusColor = 'var(--light-red)';
                modContainer.container.style.cursor = 'not-allowed';
                modContainer.container.style.backgroundColor = 'var(--dark-blue)'
            }
            const status = nameContainer.createText(statusText, 50);
            status.style.fontFamily = 'var(--font)';
            status.style.fontWeight = '400';
            status.style.fontSize = '16px';
            status.style.color = statusColor;
            this.modsInfo[mod.id] = [modContainer.container, status, mod];
        }
        updateSelectedMods() {
            Object.values(this.modsInfo).forEach(([modContainer, status, mod]) => {
                const code = loadResults[mod.id].code;
                if (code === 7) {
                    status.textContent = 'Удалён';
                    status.style.color = 'var(--light-red)';
                    modContainer.style.backgroundColor = 'var(--dark-blue)';
                    modContainer.style.cursor = 'not-allowed';
                } else if (mod.id === this.selectedMod) {
                    modContainer.style.backgroundColor = 'var(--background)';
                    modContainer.style.cursor = 'default';
                } else {
                    modContainer.style.backgroundColor = 'var(--blue)';
                    modContainer.style.cursor = 'pointer';
                }
            });
        }
        showModInfo(loadResult) {
            const mod = loadResult.manifest;
            const code = loadResult.code;
            const error = loadResult.error;
            const not_founded = loadResult.not_founded;

            this.closeModInfo();
            const del = this.infoContainer.createText(`Удалить \`${mod.name}\``, '20px');
            del.style.padding = '5px';
            del.style.backgroundColor = 'var(--light-red)';
            del.style.lineHeight = '20px';
            del.style.fontFamily = 'var(--font)';
            del.style.fontWeight = '400';
            del.style.fontSize = '16px';
            del.style.margin = '10px';
            del.style.borderRadius = '8px';
            del.style.cursor = 'pointer';
            del.onclick = () => {
                loadResults[mod.id].code = 7;
                modsToLoad.forEach((pair) => {
                    const manifest = obtainModManifest(pair[1]);
                    if (manifest !== undefined && manifest.id === mod.id) modsToLoad.splice(modsToLoad.indexOf(pair), 1);
                });
                this.closeModInfo();
                localStorage.setItem('mods', JSON.stringify(modsToLoad));
                this.selectedMod = '';
                this.updateSelectedMods();
                // Добавить настройку моментального перезапуска при удалении мода
            }
            const loadedMod = fapi.getModByIdName(mod.id);
            if (loadedMod !== undefined) loadedMod.showUI(this.infoContainer);
        }
        closeModInfo() {
            this.infoContainer.clear();
        }
    }
    new class WorkshopPage extends FModPage {
        constructor() {
            super('x_dlc.community');
            this.translates = ['Community', 'Сообщество', 'Сообщество', 'Сообщество'];
            this.drawCallback = () => undefined;
            this.allMods = [];
            this.allMaps = [];
            this.sync();
        }
        sync() {
            this.allMods = []
            this.allMaps = []
            const modsData = obtainSpreadsheetData('2PACX-1vQK8mXB2urT65dr12o77jSmdHk1SSfF3qDY5PUXwWRLww-_TSjoEVsDOw22q9_PHSYiYx31l9pdPUzP', '0').split('\n');
            modsData.forEach((modUrl) => {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", modUrl, false);
                xhr.send();
                if (xhr.status !== 200) return;
                const mod = JSON.parse(xhr.responseText);
                mod.source = modUrl;
                this.allMods.push(mod);
            });
            const mapsData = obtainSpreadsheetData('2PACX-1vQK8mXB2urT65dr12o77jSmdHk1SSfF3qDY5PUXwWRLww-_TSjoEVsDOw22q9_PHSYiYx31l9pdPUzP', '1606349766').split('\n');
            mapsData.forEach((map) => {
                const data = map.split('\t');
                this.allMaps.push({
                    'id': data[0],
                    'author': data[1],
                    'name': data[2],
                    'description': data[3],
                    'tags': data[4].split(','),
                });
            });
        }
        draw(element) {
            super.draw(element);
            this.createSpace("100px");
            this.leftContainer = this.createContainer(15, false);
            this.leftContainer.container.style.backgroundColor = 'var(--norm-blue)';
            this.leftContainer.createSpace('50px');
            this.modsCategory = this.leftContainer.createButton('Моды', '100px')
            this.modsCategory.style.boxSizing = 'border-box';
            this.modsCategory.style.padding = '10px';
            this.modsCategory.style.marginBottom = '15px';
            this.modsCategory.style.borderRadius = '0';
            this.modsCategory.style.fontSize = '30px';
            this.modsCategory.style.fontWeight = '700';
            this.modsCategory.onclick = () => this.selectMods();
            this.mapsCategory = this.leftContainer.createButton('Карты', '100px')
            this.mapsCategory.style.boxSizing = 'border-box';
            this.mapsCategory.style.padding = '10px';
            this.mapsCategory.style.marginBottom = '15px';
            this.mapsCategory.style.borderRadius = '0';
            this.mapsCategory.style.fontSize = '30px';
            this.mapsCategory.style.fontWeight = '700';
            this.mapsCategory.onclick = () => this.selectMaps();
            this.tagsContainer = this.leftContainer.createContainer(1);
            this.createSpace("50px");
            this.cardsContainer = this.createContainer(70, false);
            this.cardsContainer.container.style.margin = '25px'
            this.maxCards = 4;
            this.createSpace("100px");
            this.selectMods();
        }
        selectMods() {
            this.modsCategory.style.backgroundColor = 'var(--background)';
            this.modsCategory.style.cursor = 'default';
            this.mapsCategory.style.backgroundColor = 'var(--blue)';
            this.mapsCategory.style.cursor = 'pointer';
            this.selectedCategory = 'mods';
            this.cardsContainer.clear();
            for (let i = 0; i < this.allMods.length; i += this.maxCards) {
                const mods = this.allMods.slice(i, i + this.maxCards);
                const groupContainer = this.cardsContainer.createContainer('300px')
                let b = 0
                mods.forEach((mod) => {
                    if (b === 1) groupContainer.createSpace('50px')
                    const modCard = groupContainer.createContainer(10, false);
                    modCard.container.style.backgroundColor = 'var(--norm-blue)';
                    modCard.container.style.borderRadius = '4%';
                    // modCard.createImage(mod.icon, 5)
                    const header = modCard.createContainer(5);
                    header.container.style.borderRadius = '10px 10px 0 0';
                    header.container.style.backgroundColor = 'var(--blue)'
                    const icon = header.createImage(mod.icon, 'auto');
                    icon.style.margin = '5px';
                    icon.style.backgroundColor = 'var(--background)';
                    icon.style.borderRadius = '20px';
                    const rightHeader = header.createContainer(25, false);
                    const title = rightHeader.createText(mod.name, 5);
                    title.style.textAlign = 'center'
                    title.style.margin = '0'
                    title.style.fontSize = '24px'
                    console.log(loadResults)
                    let label = 'Установить';
                    let color = 'var(--light-green)';
                    let cursor = 'pointer';
                    let callback = () => {
                        loadResults[mod.id] = {'manifest': mod, 'code': 5};
                        modsToLoad.push([true, mod.source]);
                        localStorage.setItem('mods', JSON.stringify(modsToLoad));
                        this.selectMods();
                    }
                    if (loadResults[mod.id] !== undefined) {
                        label = 'Установлен';
                        color = 'var(--light-blue)';
                        cursor = 'default';
                        callback = () => {
                            // loadResults[mod.id] = {'manifest': mod, 'code': 5};
                            // modsToLoad.forEach((pair) => {
                            //     if (pair[1] === mod.source) modsToLoad.splice(modsToLoad.indexOf(pair), 1);
                            // });
                            // localStorage.setItem('mods', JSON.stringify(modsToLoad));
                            // this.selectMods();
                        }
                    }
                    const downloadBtn = rightHeader.createButton(label, 5);
                    downloadBtn.style.padding = '0'
                    downloadBtn.style.margin = '5px 50px';
                    downloadBtn.style.borderRadius = '12px';
                    downloadBtn.style.backgroundColor = color;
                    downloadBtn.style.cursor = cursor;
                    downloadBtn.onclick = () => callback();
                    const description = modCard.createText('Автор: ' + mod.author + '<br>' + (mod.description ?? 'Описания нету'), 15)
                    description.style.margin = '5px'
                    b = 1;
                });
                for (let i = 0; i < this.maxCards - mods.length; i += 1) {
                    if (b === 1) groupContainer.createSpace('50px');
                    groupContainer.createSpace(10);
                    b = 1;
                }
            }
        }
        selectMaps() {
            this.modsCategory.style.backgroundColor = 'var(--blue)';
            this.modsCategory.style.cursor = 'pointer';
            this.mapsCategory.style.backgroundColor = 'var(--background)';
            this.mapsCategory.style.cursor = 'default';
            this.selectedCategory = 'maps';
            this.cardsContainer.clear();
            for (let i = 0; i < this.allMaps.length; i += this.maxCards) {
                const maps = this.allMaps.slice(i, i + this.maxCards);
                const groupContainer = this.cardsContainer.createContainer('300px')
                let b = 0
                maps.forEach((map) => {
                    if (b === 1) groupContainer.createSpace('50px')
                    const modCard = groupContainer.createContainer(10, false);
                    modCard.container.style.backgroundColor = 'var(--norm-blue)';
                    modCard.container.style.borderRadius = '4%';
                    const header = modCard.createContainer(5, false);
                    header.container.style.borderRadius = '10px 10px 0 0';
                    header.container.style.backgroundColor = 'var(--blue)'
                    // const icon = header.createText('▶', '57.5px');
                    // icon.style.padding = '10px';
                    // icon.style.margin = '5px';
                    // icon.style.borderRadius = '20px';
                    // icon.style.fontSize = '30px';
                    // icon.style.textAlign = 'center'
                    // icon.style.backgroundColor = 'var(--light-green)';
                    // icon.style.filter = 'invert(1)'
                    const title = header.createText(map.name, 5);
                    title.style.textAlign = 'center';
                    title.style.margin = '0';
                    title.style.fontSize = '24px';
                    title.style.lineHeight = '2';
                    const playBtn = header.createButton('Запустить', 3);
                    playBtn.style.padding = '0'
                    playBtn.style.margin = '0 50px 5px';
                    playBtn.style.borderRadius = '12px';
                    playBtn.style.backgroundColor = 'var(--light-green)';
                    playBtn.style.cursor = 'pointer';
                    playBtn.onclick = () => window.location.pathname = '/map-' + map.id;
                    const description = modCard.createText('Автор: ' + map.author + '<br>' + (map.description ?? 'Описания нету'), 15)
                    description.style.margin = '5px'
                    b = 1;
                });
                for (let i = 0; i < this.maxCards - maps.length; i += 1) {
                    if (b === 1) groupContainer.createSpace('50px');
                    groupContainer.createSpace(10);
                    b = 1;
                }
            }
        }
    }
    new class ModalHandler {
        constructor() {
            this.openedModal = null;
            imodules.ModalHandler = this;
        }
        openedAnyModal() {
            return this.openedModal !== null;
        }
        closeModal() {
            if (this.openedModal === null) return false;
            this.openedModal.close();
            window.document.activeElement.blur();
            this.openedModal = null;
            return true;
        }
        showModal() {
            this.closeModal();
            return this.openedModal = new FModal();
        }
    };
    // endregion
    // region Mod Loading
    if (localStorage.getItem('xdlcversion') !== fapi.VERSION.toString()) {
        localStorage.setItem('xdlcversion', fapi.VERSION.toString());
        localStorage.setItem('mods', '[]');
    }
    const modsToLoad = JSON.parse(localStorage.getItem('mods') ?? '[]');
    const manifests = {};
    const loadResults = {};
    modsToLoad.forEach((pair) => {
        const enabled = pair[0];
        const jsonURL = pair[1];
        if (!enabled) return; // TODO: Добавить потом выключение мода
        const manifest = obtainModManifest(jsonURL)
        if (manifest === undefined) {
            modsToLoad.splice(modsToLoad.indexOf(pair), 1);
            return;
        }
        manifests[manifest.id] = manifest;
    })
    function checkCircularDependency(id) {
        return false; // TODO: Проверка цикличных зависимостей
    }
    function loadMod(id, manifest) {
        if (Object.keys(loadResults).includes(id)) return loadResults[id].code === 1;
        if (manifest.xdlcversion !== fapi.VERSION) {
            loadResults[id] = {'manifest': manifest, 'code': 6};
            return false;
        }
        if (checkCircularDependency()) {
            loadResults[id] = {'manifest': manifest, 'code': 3};
            return false;
        }
        const not_founded_dependencies = [];
        manifest.dependencies.forEach((dependency) => {
            if (!manifests.includes(dependency)) {
                not_founded_dependencies.push(dependency);
                return;
            }
            loadMod(dependency, manifests[dependency]);
        });
        if (not_founded_dependencies.length !== 0) {
            loadResults[id] = {'manifest': manifest, 'code': 4, 'not_founded': not_founded_dependencies};
            return false;
        }
        const xhr = new XMLHttpRequest();
        xhr.open("GET", prettifyModUrl(manifest.script), false);
        xhr.send();
        if (xhr.status !== 200) {
            loadResults[id] = {'manifest': manifest, 'code': 0};
            return false;
        }
        try {
            new Function(xhr.responseText).call(undefined);
            loadResults[id] = {'manifest': manifest, 'code': 1};
            return true;
        } catch(e) {
            loadResults[id] = {'manifest': manifest, 'code': 2, 'error': e};
            console.log(e);
            return false;
        }
    }
    Object.keys(manifests).forEach((id) => loadMod(id, manifests[id]));
    /*
     * 0 - `script.js` не найден
     * 1 - `script.js` загружен
     * 2 - `script.js` не загружен вследствие ошибки
     * 3 - циклические зависимости
     * 4 - зависимость не найдена
     * 5 - требуется перезагрузка
     * 6 - версия модлоадера отличается
     * 7 - был удалён
     */
    // endregion
    // region Modifying Modules
    ref('GameMap', (gameMap) => class GameMap extends gameMap {
        constructor() {
            super();
        }
        setArrowType(x, y, type, hz=true) {
            const chunk = this.getOrCreateChunkByArrowCoordinates(x, y);
            const ax = x - chunk.x * modules.CHUNK_SIZE;
            const ay = y - chunk.y * modules.CHUNK_SIZE;
            const arrow = chunk.getArrow(ax, ay);
            if (arrow.chunk === undefined) {
                arrow.chunk = chunk;
                arrow.x = ax;
                arrow.y = ay;
                arrow.wx = x;
                arrow.wy = y;
                arrow.handler = fapi.ARROWS[0];
            }
            if (!hz || arrow.type === type || !arrow.canBeEdited || modules.PlayerSettings.levelArrows.includes(arrow.type)) return;
            arrow.signal = 0;
            arrow.type = type;
            arrow.handler = fapi.ARROWS[type];
        }
        setArrowCustomData(x, y, custom_data) {
            const chunk = this.getChunkByArrowCoordinates(x, y);
            if (chunk === undefined) return;
            const ax = x - chunk.x * modules.CHUNK_SIZE;
            const ay = y - chunk.y * modules.CHUNK_SIZE;
            const arrow = chunk.getArrow(ax, ay);
            if (!arrow.canBeEdited || modules.PlayerSettings.levelArrows.includes(arrow.type)) return;
            arrow.custom_data = custom_data.slice(0);
        }
    });
    ref('ChunkUpdates', (chunkUpdates) => new class ChunkUpdates {
        /**
         * Перенос текущих значений стрелочки в старые
         * @param {Object.<string,any>} arrow Стрелочка
         */
        toLast(arrow) {
            arrow.lastType = arrow.type;
            arrow.lastSignal = arrow.signal;
            arrow.lastRotation = arrow.rotation;
            arrow.lastFlipped = arrow.flipped;
        }
        /**
         * Добавляет единицу к количеству сигналов полученной стрелочки
         * @param {Object.<string,any>} fromArrow Стрелочка которая передала сигнал
         * @param {Object.<string,any> | void} arrow Стрелочка которая приняла сигнал
         * @param {number} add Сила сигнала
         */
        updateCount(fromArrow, arrow, add=1) {
            if (arrow !== undefined) {
                arrow.signalsCount += add;
                arrow.tempRefs.push(fromArrow);
                // if (arrow.chunk !== undefined) arrow.chunk.changed = true;
            }
        }
        /**
         * Блокирует сигнал полученной стрелочки
         * <br><b>Вызывать не в `transmit` а в `block` иначе не будет никакого эффекта!</b>
         * @param {Object.<string,any> | void} arrow Стрелочка
         */
        blockSignal(arrow) {
            if (arrow !== undefined) {
                arrow.signal = 0;
                // if (arrow.chunk !== undefined) arrow.chunk.changed = true;
            }
        }
        /**
         * Сложный вариант получения стрелочки
         * @param {Object.<string,any>} chunk - Чанк
         * @param {number} x Позиция по X
         * @param {number} y Позиция по Y
         * @param {number} rotation Поворот стрелочки ( 0 вверх | 1 вправо | 2 вниз | 3 влево )
         * @param {boolean} flipped Зеркально расположена или нет
         * @param {number} distance Дистанция от стрелочки ( отрицательное = вперёд | положительное = назад )
         * @param {number} diagonal Дистанция от стрелочки в сторону ( положительное = вправо | отрицательное = влево )
         * @return {Object.<string,any> | void} Возвращает стрелочку если находит её, а иначе `undefined`
         */
        getArrowAt(chunk, x, y, rotation, flipped, distance=-1, diagonal=0) {
            if (flipped) diagonal = -diagonal;

            if (rotation === 0) {
                y += distance;
                x += diagonal;
            }
            else if (rotation === 1) {
                y += diagonal;
                x -= distance;
            }
            else if (rotation === 2) {
                y -= distance;
                x -= diagonal;
            }
            else if (rotation === 3) {
                y -= diagonal;
                x += distance;
            }

            let rChunk = chunk;
            if (x >= modules.CHUNK_SIZE) {
                if (y >= modules.CHUNK_SIZE) {
                    rChunk = chunk.adjacentChunks[3];
                    x -= modules.CHUNK_SIZE;
                    y -= modules.CHUNK_SIZE;
                }
                else if (y < 0) {
                    rChunk = chunk.adjacentChunks[1];
                    x -= modules.CHUNK_SIZE;
                    y += modules.CHUNK_SIZE;
                }
                else {
                    rChunk = chunk.adjacentChunks[2];
                    x -= modules.CHUNK_SIZE;
                }
            }
            else if (x < 0) {
                if (y < 0) {
                    rChunk = chunk.adjacentChunks[7];
                    x += modules.CHUNK_SIZE;
                    y += modules.CHUNK_SIZE;
                } else if (y >= modules.CHUNK_SIZE) {
                    rChunk = chunk.adjacentChunks[5];
                    x += modules.CHUNK_SIZE;
                    y -= modules.CHUNK_SIZE;
                } else {
                    rChunk = chunk.adjacentChunks[6];
                    x += modules.CHUNK_SIZE;
                }
            }
            else if (y < 0) {
                rChunk = chunk.adjacentChunks[0];
                y += modules.CHUNK_SIZE;
            }
            else if (y >= modules.CHUNK_SIZE) {
                rChunk = chunk.adjacentChunks[4];
                y -= modules.CHUNK_SIZE;
            }
            if (rChunk !== undefined) return rChunk.getArrow(x, y);
        }
        /**
         * Простой вариант получения стрелочки
         * @param {Object.<string,any>} arrow - Стрелочка
         * @param {number} distance Дистанция от стрелочки ( отрицательное = вперёд | положительное = назад )
         * @param {number} diagonal Дистанция от стрелочки в сторону ( отрицательное = вправо | положительное = влево )
         * @return {Object.<string,any> | void} Возвращает стрелочку если находит её, а иначе `undefined`
         */
        sgetArrowAt(arrow, distance=-1, diagonal=0) {
            if (arrow.flipped) diagonal = -diagonal;

            let x = arrow.wx;
            let y = arrow.wy;

            if (arrow.rotation === 0) {
                y += distance;
                x += diagonal;
            }
            else if (arrow.rotation === 1) {
                y += diagonal;
                x -= distance;
            }
            else if (arrow.rotation === 2) {
                y -= distance;
                x -= diagonal;
            }
            else if (arrow.rotation === 3) {
                y -= diagonal;
                x += distance;
            }
            return imodules.gamemap.getArrow(x, y);
        }
        /**
         * Обновление сигналов стрелочек
         * @param {Object.<string,any>} gameMap Карта
         * @return {void} Ничего не возвращает
         */
        update(gameMap) {
            imodules.gamemap = gameMap;
            const chunks = Array.from(gameMap.chunks.values());
            const chunksLength = chunks.length;
            // let anyProcessed = false;
            for (let ci = 0; ci < chunksLength; ci++) {
                const arrows = chunks[ci].arrows;
                // chunks[ci].changed = false;
                for (let ai = 0; ai < 256; ai++) {
                    const arrow = arrows[ai];
                    this.toLast(arrow);
                    arrow.handler.transmit(arrow);
                }
            }
            for (let ci = 0; ci < chunksLength; ci++) {
                // if (chunks[ci].changed === false && gameMap.initialized) return;
                const arrows = chunks[ci].arrows;
                for (let ai = 0; ai < 256; ai++) {
                    const arrow = arrows[ai];
                    arrow.refs = arrow.tempRefs;
                    arrow.tempRefs = [];
                    arrow.handler.update(arrow);
                    arrow.lastSignalsCount = arrow.signalsCount;
                    arrow.signalsCount = 0;
                }
                // anyProcessed = true;
            }
            for (let ci = 0; ci < chunksLength; ci++) {
                // if (chunks[ci].changed === false && gameMap.initialized) return;
                const arrows = chunks[ci].arrows;
                for (let ai = 0; ai < 256; ai++) {
                    const arrow = arrows[ai];
                    arrow.handler.block(arrow);
                }
            }
            // if (!anyProcessed) gameMap.initialized = false;
            if (!fapi.experimental.updateLevelArrow) return;
            gameMap.chunks.forEach((chunk) => {
                chunk.levelArrows.forEach((levelArrow) => {
                    if (levelArrow.type === 23) levelArrow.update();
                });
            });
        }
        /**
         * Стирает все сигналы стрелочек
         * @param {Object.<string,any>} gameMap Карта
         * @return {void} Ничего не возвращает
         */
        clearSignals(gameMap) {
            gameMap.chunks.forEach((chunk) => {
                chunk.arrows.forEach((arrow) => {
                    arrow.signal = 0;
                    arrow.lastSignal = 0;
                    arrow.signalsCount = 0;
                });
                chunk.levelArrows.forEach((levelArrow) => levelArrow.state = null);
            });
        }
        /**
         * Проверка поменялась ли стрелочка или нет
         * @param {Object.<string,any>} arrow Стрелка
         * @return {boolean} Изменилась ли стрелка или нет
         */
        wasArrowChanged(arrow) {
                return arrow.signal !== arrow.lastSignal ||
                       arrow.type !== arrow.lastType ||
                       arrow.rotation !== arrow.lastRotation ||
                       arrow.flipped !== arrow.lastFlipped;
            }
    });
    ref('save', (save) => function(gameMap) {
        const data = [];
        let useMods = false;
        gameMap.chunks.forEach((chunk) => {
            const types = chunk.getArrowTypes()
            types.forEach((type) => {
                if (type > fapi.BASIC_TYPES) useMods = true;
            });
        });
        const savedModsOrder = [];
        if (useMods) {
            data.push(255); // Конец обозначений модов
            fapi.mods.forEach((mod) => {
                if (data.length !== 1) data.push(254);
                mod.idname.split('').forEach((symbol) => {
                    data.push(fapi.ID_SYMBOLS.indexOf(symbol));
                });
                savedModsOrder.push(mod);
            });
            data.push(255); // Конец обозначений модов
        }
        data.push(0, 0); // ВЕРСИЯ ИГРЫ ( ПОКА ЧТО НЕ МЕНЯЕТСЯ )
        data.push(255 & gameMap.chunks.size, gameMap.chunks.size >> 8 & 255);
        gameMap.chunks.forEach((chunk) => {
            const types = chunk.getArrowTypes();
            const x = [255 & Math.abs(chunk.x), Math.abs(chunk.x) >> 8 & 255];
            const y = [255 & Math.abs(chunk.y), Math.abs(chunk.y) >> 8 & 255];
            chunk.x < 0 ? x[1] |= 128 : x[1] &= 127;
            chunk.y < 0 ? y[1] |= 128 : y[1] &= 127;
            data.push(...x);
            data.push(...y);
            data.push(types.length - 1);
            types.forEach((arrowType) => {
                const isFromMod = arrowType > fapi.BASIC_TYPES;
                if (useMods && isFromMod) {
                    data.push(255); // Обозначение что это стрелочка из мода
                    let marrow = fapi.getArrowByType(arrowType);
                    data.push(marrow.id); // Айди стрелочки из мода
                    data.push(savedModsOrder.indexOf(marrow.mod)); // Индекс мода из `обозначения модов`
                }
                else data.push(arrowType);
                data.push(0);
                const n = data.length - 1;
                let o = 0;
                for (let x = 0; x < modules.CHUNK_SIZE; x++) {
                    for (let y = 0; y < modules.CHUNK_SIZE; y++) {
                        const arrow = chunk.getArrow(x, y);
                        if (arrow.type === arrowType) {
                            const e = x | y << 4;
                            const s = arrow.rotation | (arrow.flipped ? 1 : 0) << 2;
                            data.push(e);
                            data.push(s);
                            if (useMods && isFromMod) {
                                if (arrow.custom_data === undefined) arrow.custom_data = [];
                                const save_cd = fapi.getArrowByType(arrow.type).save_cd(arrow);
                                data.push(save_cd.length); // Длина данных стрелочки
                                data.push(...save_cd); // Данные стрелочки
                            }
                            o++;
                        }
                    }
                }
                data[n] = o - 1;
            });
        })
        return data;
    });
    ref('load', (load) => function(gameMap, data) {
        if (data.length < 4) return;
        const modLoading = data[0] === 255;
        if (modLoading) console.log('Modded load')

        let s = 0;
        let si;
        if (modLoading) {
            s++;
            si = data[s++];
        }
        let modsDefine = [];
        let unknownMods = [];
        let modDefine = '';

        if (modLoading) {
            while (si !== 255) {
                if (si === 254) {
                    let mod = fapi.getModByIdName(modDefine);
                    if (mod === undefined) unknownMods.push(modDefine);
                    modsDefine.push(mod);
                    modDefine = '';
                    si = data[s++];
                    continue;
                }
                modDefine += fapi.ID_SYMBOLS[si];
                si = data[s++];
            }
            if (modDefine !== '') {
                let mod = fapi.getModByIdName(modDefine)
                if (mod === undefined) unknownMods.push(modDefine);
                modsDefine.push(mod);
            }
            if (unknownMods.length !== 0) {
                let text = 'Невозможно загрузить карту, отстутствуют данные моды:\n';
                unknownMods.forEach((mod) => text += mod + '\n');
                text += 'Желательно выйти с карты чтобы не перезаписать её 💀';
                alert(text);
                // window.location.reload()
                throw new Error('Unknown mods');
            }
        }

        let version = data[s++];
        version |= data[s++] << 8
        if (version !== 0) throw new Error("Unsupported save version");

        let chunks_count = data[s++] | data[s++] << 8;
        for (let _ = 0; _ < chunks_count; _++) {
            let x = data[s++];
            x |= (127 & data[s++]) << 8;
            if ((data[s - 1] & 128) !== 0) x = -x;

            let y = data[s++];
            y |= (127 & data[s++]) << 8;
            if ((data[s - 1] & 128) !== 0) y = -y;

            const arrows_count = data[s++] + 1;
            const chunk = gameMap.getOrCreateChunk(x, y)
            for (let _ = 0; _ < arrows_count; _++) {
                let type = data[s++];
                let modArrow = type === 255;
                let mod;
                let marrow;
                if (modArrow) {
                    type = data[s++];
                    mod = modsDefine[data[s++]];
                    marrow = mod.arrows[type];
                    type = marrow.type;
                }
                const count = data[s++] + 1;
                for (let adata = 0; adata < count; adata++) {
                    const i = data[s++];
                    const n = data[s++];
                    const x = 15 & i;
                    const y = i >> 4;
                    const arrow = chunk.getArrow(x, y);
                    if (modArrow) {
                        let cdcount = data[s++];
                        let cd = []
                        for (let _ = 0; _ < cdcount; _++) cd.push(data[s++]);
                        arrow.custom_data = fapi.getArrowByType(type).load_cd(cd);
                    }
                    arrow.refs = [];
                    arrow.lastRefs = [];
                    arrow.chunk = chunk;
                    arrow.x = x;
                    arrow.y = y;
                    arrow.wx = x + chunk.x * modules.CHUNK_SIZE;
                    arrow.wy = y + chunk.y * modules.CHUNK_SIZE;
                    arrow.type = type;
                    arrow.rotation = 3 & n;
                    arrow.flipped = 0 !== (4 & n);
                    arrow.handler = fapi.ARROWS[type];
                }
            }
        }
    });
    ref('Arrow', (arrow) => class Arrow extends arrow {
        constructor() {
            super();
            this.tempRefs = [];
            this.refs = [];
            this.chunk = undefined;
            this.x = 0;
            this.y = 0;
            this.wx = 0;
            this.wy = 0;
            this.custom_data = [];
            this.handler = fapi.ARROWS[0];
        }
    });
    ref('Chunk', (arrow) => class Arrow extends arrow {
        removeArrow(e, t) {
            this.arrows[e + t * n.CHUNK_SIZE].type = 0;
            this.arrows[e + t * n.CHUNK_SIZE].rotation = 0;
            this.arrows[e + t * n.CHUNK_SIZE].flipped = false;
            this.arrows[e + t * n.CHUNK_SIZE].signal = 0;
            this.arrows[e + t * n.CHUNK_SIZE].handler = fapi.ARROWS[0];
        }
    });
    ref('PlayerAccess', (playerAccess) => class PlayerAccess extends playerAccess {
        constructor() {
            super();
            fapi.mods.forEach((mod) => {
                for (let i = 0; i < Object.values(mod.arrows).length; i += 5) {
                    let group = Object.values(mod.arrows).slice(i, i + 5).map((arrow) => arrow.type);
                    this.arrowGroups.push(group);
                }
            });
            imodules.playerAccess = this;
        }
    });
    ref('UIToolbarItem', (uiToolbarItem) => class UIToolbarItem extends uiToolbarItem {
        setImage(id) {
            if (id < fapi.BASIC_TYPES) this.image.src = `res/sprites/arrow${id + 1}.png?v=${modules.PlayerSettings.version}`
            else {
                const marrow = fapi.getArrowByType(id + 1);
                if (marrow !== undefined) this.image.src = marrow.icon_url;
            }
        }
    });
    ref('UIInventory', (uiInventory) => class UIInventory extends uiInventory {
        addArrows(e) {
            this.arrows = [];
            this.arrowGroups = e;
            this.itemsBlock.remove();
            this.itemsBlock = document.createElement("div");
            this.itemsBlock.className = "ui-inventory-items";
            this.dialog.appendChild(this.itemsBlock);
            for (let t = 0; t < e.length; t++) {
                const s = e[t];
                const n = document.createElement("div");
                n.className = "ui-inventory-line";
                n.style.gridArea = `${t % 12 + 1} / ${~~(t / 12) + 1}`;
                this.itemsBlock.appendChild(n);
                this.arrows.push([]);
                for (let e = 0; e < s.length; e++) {
                    const o = document.createElement("div");
                    o.className = "inventory-item";
                    o.onclick = () => this.selectCallback(s[e]);
                    n.appendChild(o);
                    const a = document.createElement("img");
                    if (s[e] <= fapi.BASIC_TYPES) a.src = `/res/sprites/arrow${s[e]}.png?v=${modules.PlayerSettings.version}`;
                    else {
                        const marrow = fapi.getArrowByType(s[e]);
                        if (marrow !== undefined) a.src = marrow.icon_url;
                    }
                    o.appendChild(a);
                    this.arrows[t].push(o);
                }
            }
            this.itemsBlock.style.display = 'grid';
        }
    });
    ref('UIArrowInfo', (uiArrowInfo) => class UIArrowInfo extends uiArrowInfo {
        constructor(e, t) {
            super(e, t);
            this.image = this.element.querySelector('.ui-arrow-info-image');
            if (t <= fapi.BASIC_TYPES) this.image.src = `res/sprites/arrow${t}.png?v=${modules.PlayerSettings.version}`
            else {
                const marrow = fapi.getArrowByType(t);
                if (marrow !== undefined) this.image.src = marrow.icon_url;
            }
        }
    });
    ref('PlayerSettings', (playerSettings) => {
        playerSettings.patched = false;
        return playerSettings;
    });
    ref('PlayerUI', (playerUI) => class PlayerUI extends playerUI {
        isMenuOpen() {
            return this.menu !== null && !this.menu.getIsRemoved() || imodules.ModalHandler.openedAnyModal();
        }
    });
    ref('PlayerControls', (playerControls) => class PlayerControls extends playerControls {
        constructor(e, t, s, i) {
            super(e, t, s, i);
            const pLCC = this.leftClickCallback;
            this.leftClickCallback = () => {
                pLCC();
                const arrow = this.getArrowByMousePosition();
                const shiftPressed = this.keyboardHandler.getShiftPressed();

                if (arrow !== undefined && imodules.playercontrols.freeCursor && arrow.type > fapi.BASIC_TYPES) {
                    let marrow = fapi.getArrowByType(arrow.type);
                    if (marrow !== undefined && marrow.clickable) marrow.click(arrow, shiftPressed);
                }
            }
            this.mouseHandler.leftClickCallback = this.leftClickCallback;
            const pKDC = this.keyDownCallback;
            this.keyDownCallback = (e, t) => {
                if (imodules.ModalHandler.openedAnyModal()) return;
                // TODO: Возможность подписаться на ивент
                pKDC(e, t);
            }
            this.keyboardHandler.keyDownCallback = this.keyDownCallback;
            imodules.playercontrols = this;
            this.activeCustomData = [];
        }
        update() {
            if (imodules.playercontrols.keyboardHandler.getKeyPressed('Escape') && imodules.ModalHandler.closeModal()) return;
            else if (imodules.ModalHandler.openedAnyModal()) return document.body.style.cursor = 'default';
            super.update();
            imodules.playercontrols.pressed = this.mouseHandler.getMousePressed();
            const arrow = imodules.playercontrols.getArrowByMousePosition();
            if (arrow !== undefined && arrow.type > fapi.BASIC_TYPES) {
                let marrow = fapi.getArrowByType(arrow.type);
                if (marrow !== undefined) {
                    document.body.style.cursor = marrow.clickable || marrow.pressable ? 'pointer' : 'default';
                    const shiftPressed = this.keyboardHandler.getShiftPressed();
                    if (marrow.pressable && imodules.playercontrols.pressed) marrow.press(arrow, shiftPressed);
                }
            }
        }
        pickArrow() {
            if (!imodules.playerAccess.canPick) return;
            super.pickArrow();
            const e = this.getArrowByMousePosition();
            if (e !== undefined && e.custom_data !== undefined) this.activeCustomData = [...e.custom_data];
            else this.activeCustomData = -1;
        }
        setArrows(e, t) {
            if (!imodules.playerAccess.canSetArrows) return;
            // const a = imodules.playercontrols.getArrowByMousePosition();
            // if (a !== undefined && imodules.playercontrols.lsa !== undefined && imodules.playercontrols.lsa[0] === a.wx && imodules.playercontrols.lsa[1] === a.wy) return;
            super.setArrows(e, t);
            imodules.selectedmap.getCopiedArrows().forEach((s, i) => {
                if (modules.PlayerSettings.levelArrows.includes(s.type)) return;
                const [n, o] = i.split(",").map((e) => parseInt(e, 10));
                const x = e + n;
                const y = t + o;
                if (fapi.experimental.autoRotateArrow && imodules.playercontrols.pressed && imodules.playercontrols.lsa !== undefined) {
                        const ox = x - imodules.playercontrols.lsa[0];
                        const oy = imodules.playercontrols.lsa[1] - y;
                        if (Math.abs(ox) + Math.abs(oy) === 1) {
                            let rotation = 0;
                            if (ox === -1) rotation = 3;
                            else if (ox === 1) rotation = 1;
                            else if (oy === 1) rotation = 0;
                            else if (oy === -1) rotation = 2;
                            this.game.gameMap.setArrowRotation(imodules.playercontrols.lsa[0], imodules.playercontrols.lsa[1], rotation);
                        }
                    }
                imodules.playercontrols.lsa = [x, y];
                if (imodules.playercontrols.activeCustomData !== -1 && imodules.playercontrols.activeCustomData !== undefined)
                    imodules.gamemap.setArrowCustomData(x, y, imodules.playercontrols.activeCustomData);
                else imodules.gamemap.setArrowCustomData(x, y, s.custom_data);
            });
        }
    });
    ref('SelectedMap', (selectedMap) => class SelectedMap extends selectedMap {
        constructor() {
            super();
            imodules.selectedmap = this;
        }
        setArrow(type) {
            super.setArrow(type);
            const marrow = fapi.getArrowByType(type);
            if (marrow === undefined) return;
            imodules.playercontrols.activeCustomData = marrow.custom_data.slice(0);
        }
        copyFromGameMap(gameMap) {
            this.rotationState = 0;
            this.flipState = false;
            this.arrowsToPutOriginal.clear();
            this.arrowsToPut.clear();
            let t = Number.MAX_SAFE_INTEGER;
            let s = Number.MAX_SAFE_INTEGER;
            this.tempMap.clear();
            this.selectedArrows.forEach((sarrow) => {
                    const [n, o] = sarrow.split(",").map((e => parseInt(e, 10)));
                    const arrow = gameMap.getArrow(n, o);
                    if (arrow !== undefined && arrow.canBeEdited) {
                        t = Math.min(t, n);
                        s = Math.min(s, o);
                    }
                }
            );
            this.selectedArrows.forEach((sarrow) => {
                    const [n, o] = sarrow.split(",").map((e=>parseInt(e, 10)));
                    const a = n - t;
                    const r = o - s;
                    const arrow = gameMap.getArrow(n, o);
                    if (arrow !== undefined && arrow.canBeEdited) {
                        this.tempMap.setArrowType(a, r, arrow.type);
                        this.tempMap.setArrowRotation(a, r, arrow.rotation);
                        this.tempMap.setArrowFlipped(a, r, arrow.flipped);
                        this.tempMap.setArrowCustomData(a, r, arrow.custom_data);
                    }
                }
            );
            const i = (0, modules.save)(this.tempMap);
            return modules.Utils.arrayBufferToBase64(i);
        }
    });
    ref('ArrowDescriptions', (arrowDescriptions) => {
        const pgan = arrowDescriptions.getArrowName;
        const pgaa = arrowDescriptions.getArrowActivation;
        const pgad = arrowDescriptions.getArrowAction;
        arrowDescriptions.getArrowsCount = () => fapi.ARROWS.length;
        arrowDescriptions.getArrowName = (type) => {
            if (type <= fapi.BASIC_TYPES) return pgan(type);
            const index = modules.LangSettings.languages.indexOf(modules.LangSettings.getLanguage());
            return fapi.getArrowByType(type).name[index];
        };
        arrowDescriptions.getArrowActivation = (type) => {
            if (type <= fapi.BASIC_TYPES) return pgaa(type);
            const index = modules.LangSettings.languages.indexOf(modules.LangSettings.getLanguage());
            return fapi.getArrowByType(type).activation[index];
        };
        arrowDescriptions.getArrowAction = (type) => {
            if (type <= fapi.BASIC_TYPES) return pgad(type);
            const index = modules.LangSettings.languages.indexOf(modules.LangSettings.getLanguage());
            return fapi.getArrowByType(type).action[index];
        };
        return arrowDescriptions;
    });
    ref('Navigation', (navigation) => {
        class ModPageContent extends modules.Page {
            constructor(e) {
                super(e);
                this.mainDiv.style.height = '100%';
            }
            getClass() {
                return "modpage"
            }
        }
        class Navigation extends navigation {
            constructor() {
                super();
                imodules.navigation = this;
            }
            goToPath(action) {
                const regex = /modpage-([\w._]+)/;
                const match = window.location.pathname.match(regex);
                if (match) {
                    const id = match[1];
                    imodules.navigation.goToModPage(id, action);
                    return;
                }
                super.goToPath(action);
            }
            goToModPage(id, action) {
                if (imodules.menupage !== undefined) {
                    if (imodules.menupage.page !== undefined) imodules.menupage.page.dispose();
                }
                else {
                    this.removePages();
                    this.menuPage = imodules.menupage = new modules.MenuPage(`modpage-${id}`, this.doMenuAction);
                }
                const index = modules.LangSettings.languages.indexOf(modules.LangSettings.getLanguage());
                document.title = `${fapi.pages[id].translates[index]} | Стрелочки`;
                imodules.menupage.page = new ModPageContent(imodules.menupage.getContent());
                if (action === 'go') window.history.pushState(null, '', `modpage-${id}`);
                else if (action === 'start') window.history.replaceState(null, '', `modpage-${id}`);
                if (fapi.pages[id] !== undefined) fapi.pages[id].draw(imodules.menupage.page.mainDiv);
                this.modPage = fapi.pages[id];
                imodules.menupage.selectedCategory = `modpage-${id}`;
                imodules.menupage.updateSelectedCategory();
            }
            tryCloseModPage() {
                if (this.modPage === undefined) return;
                this.modPage.close();
                this.modPage = undefined;
            }
        }
        return Navigation;
    });
    ref('MenuPage', (menuPage) => class MenuPage extends menuPage {
        constructor(e, t) {
            super(e, t);
            imodules.menupage = this;
            Object.entries(fapi.pages).forEach(([idname, page]) => {
                const index = modules.LangSettings.languages.indexOf(modules.LangSettings.getLanguage());
                imodules.menupage.categories.set('modpage-' + idname, [page.translates[index], page.icon_url, null]);
                const psc = imodules.menupage.selectedCategory;
                imodules.menupage.addMenuItem('modpage-' + idname);
                imodules.menupage.selectedCategory = psc;
            })
            const pa = this.action;
            this.action = (e) => {
                imodules.navigation.tryCloseModPage();
                const regex = /modpage-([\w._]+)/;
                const match = e.match(regex);
                if (match) {
                    const id = match[1];
                    imodules.navigation.goToModPage(id, 'go');
                    return;
                }
                pa(e);
            }
        }
    });
    ref('Render', (render) => class Render extends render {
        constructor(e) {
            super(e);
            imodules.render = this;
            // region patch_atlas
            if (modules.PlayerSettings.patched) return;
            console.log('Atlas patching...');
            const images = [[1, modules.PlayerSettings.arrowAtlasImage.src]];
            fapi.mods.forEach((mod) => {
                Object.values(mod.arrows).forEach((arrow) => {
                    if (arrow.textures === undefined) arrow.textures = [arrow.icon_url];
                    if (arrow.textures.length > 6) console.warn(`Arrow with id \`${arrow.id}\` from mod \`${arrow.mod.name}\` uses \`${arrow.textures.length}\` textures for draw`);
                    arrow.TEXTURE_INDEX = fapi.MAX_TEXTURE_INDEX - 1;
                    arrow.textures.forEach((texture) => images.push([fapi.MAX_TEXTURE_INDEX++, texture]));
                });
            });
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const created = [];
            canvas.width = 4096;
            canvas.height = 4096;
            let loaded = 0;
            images.forEach(([index, src]) => {
                let x = 0;
                let y = 0;
                index -= 1;
                if (index < 128) {
                    x = index % 8;
                    y = ~~(index / 8);
                } else {
                    x = (index - 128) % 8 + 8;
                    y = ~~((index - 128) / 16);
                }
                const img = new Image();
                created.push(img);
                img.src = src;
                img.crossOrigin = '*';
                img.onload = () => {
                    ctx.drawImage(img, x * 256, y * 256);
                    loaded++;
                    if (loaded !== images.length) return;
                    game.PlayerSettings.arrowAtlasImage = new Image;
                    game.PlayerSettings.arrowAtlasImage.src = canvas.toDataURL('image/png');
                    game.PlayerSettings.arrowAtlasImage.onload = () => {
                        this.createArrowTexture(game.PlayerSettings.arrowAtlasImage);
                        imodules.game.screenUpdated = true;
                        modules.PlayerSettings.patched = true;
                        console.log('Atlas patched!');
                    }
                    created.forEach((img) => img.remove());
                }
            })
            // endregion
        }
        drawArrow(e, t, s, i, n, o, arrow) {
            if (s > fapi.BASIC_TYPES) s = arrow.handler.draw(arrow, fapi.getArrowByType(s).TEXTURE_INDEX);
            else s = arrow.handler.draw(arrow, s - 1);
            if (s === -1) return;
            if (this.lastArrowType !== s) {
                let x;
                let y;
                if (s < 128) {
                    x = s % 8;
                    y = ~~(s / 8);
                } else {
                    x = (s - 128) % 8 + 8;
                    y = ~~((s - 128) / 16);
                }
                // TODO: Проверить работу 256 текстур
                this.gl.uniform2f(this.arrowShader.getSpritePositionUniform(), x / 16, y / 16);
                this.lastArrowType = s;
            }
            if (this.lastArrowSignal !== i) {
                this.gl.uniform1i(this.arrowShader.getSignalUniform(), i);
                this.lastArrowSignal = i;
            }
            if (this.lastArrowRotation !== n || this.lastArrowFlipped !== o) {
                this.gl.uniform2f(this.arrowShader.getRotationUniform(), n / 2 * Math.PI, o ? 1 : 0);
                this.lastArrowRotation = n;
                this.lastArrowFlipped = o;
            }
            this.gl.uniform2f(this.arrowShader.getPositionUniform(), e, t);
            this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
        }
        prepareArrows(e) {
            this.gl.useProgram(this.arrowShader.getProgram());
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.arrowAtlas);
            this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
            this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
            this.gl.enableVertexAttribArray(this.arrowShader.getPositionAttribute());
            this.gl.vertexAttribPointer(this.arrowShader.getPositionAttribute(), 2, this.gl.FLOAT, !1, 0, 0);
            this.gl.uniform2f(this.arrowShader.getResolutionUniform(), this.gl.canvas.width, this.gl.canvas.height);
            this.gl.uniform1f(this.arrowShader.getSizeUniform(), e);
            this.gl.uniform1f(this.arrowShader.getSpriteSizeUniform(), 1 / 16);
        }
    });
    ref('Game', (game) => class Game extends game {
        constructor(e, t, s) {
            super(e, t, s);
            imodules.game = this;
        }
        draw() { // TODO: Исправить эту хуйню
            if (modules.PlayerSettings.patched !== true) return;
            this.updateFocus();
                        (this.drawPastedArrows || 0 !== this.selectedMap.getSelectedArrows().length) && (this.screenUpdated = !0);
                        modules.PlayerSettings.framesToUpdate[this.updateSpeedLevel] > 1 && (this.screenUpdated = !0);
                        this.screenUpdated && this.render.drawBackground(this.scale, [-this.offset[0] / modules.CELL_SIZE, -this.offset[1] / modules.CELL_SIZE]);
                        const e = this.scale;
                        this.render.prepareArrows(e);
                        const t = ~~(-this.offset[0] / modules.CELL_SIZE / 16) - 1,
                            s = ~~(-this.offset[1] / modules.CELL_SIZE / 16) - 1,
                            o = ~~(-this.offset[0] / modules.CELL_SIZE / 16 + this.width / this.scale / 16),
                            a = ~~(-this.offset[1] / modules.CELL_SIZE / 16 + this.height / this.scale / 16);
                        if (this.render.setArrowAlpha(1), this.gameMap.chunks.forEach((e => {
                                if (!(e.x >= t && e.x <= o && e.y >= s && e.y <= a)) return;
                                const r = this.offset[0] * this.scale / modules.CELL_SIZE + .025 * this.scale,
                                    l = this.offset[1] * this.scale / modules.CELL_SIZE + .025 * this.scale;
                                for (let t = 0; t < modules.CHUNK_SIZE; t++)
                                    for (let s = 0; s < modules.CHUNK_SIZE; s++) {
                                        const o = e.getArrow(t, s);
                                        if (o.type > 0 && (this.screenUpdated || modules.ChunkUpdates.wasArrowChanged(o))) {
                                            const i = (e.x * modules.CHUNK_SIZE + t) * this.scale + r,
                                                a = (e.y * modules.CHUNK_SIZE + s) * this.scale + l;
                                            this.render.drawArrow(i, a, o.type, o.signal, o.rotation, o.flipped, o)
                                        }
                                    }
                            })), performance.now() - this.drawTime > 1e3 && (this.drawTime = performance.now(), this.drawsPerSecond = 0), this.drawsPerSecond++, this.drawPastedArrows) {
                            this.render.setArrowAlpha(.5);
                            const e = this.selectedMap.getCopiedArrows();
                            0 !== e.size && (this.screenUpdated = !0), e.forEach(((e, t) => {
                                const [s, i] = t.split(",").map((e => parseInt(e, 10)));
                                let o = s,
                                    a = i,
                                    r = 0;
                                1 === this.pasteDirection ? (o = -i, a = s, r = 1) : 2 === this.pasteDirection ? (o = -s, a = -i, r = 2) : 3 === this.pasteDirection && (o = i, a = -s, r = 3);
                                const l = (o + this.mousePosition[0]) * this.scale + this.offset[0] * this.scale / modules.CELL_SIZE + .025 * this.scale,
                                    h = (a + this.mousePosition[1]) * this.scale + this.offset[1] * this.scale / modules.CELL_SIZE + .025 * this.scale;
                                this.render.drawArrow(l, h, e.type, e.signal, (e.rotation + r) % 4, e.flipped, e)
                            }))
                        }
                        if (this.render.disableArrows(), this.render.prepareSolidColor(), this.render.setSolidColor(.25, .5, 1, .25), this.selectedMap.getSelectedArrows().forEach((e => {
                                const t = e.split(",").map((e => parseInt(e, 10))),
                                    s = t[0] * this.scale + this.offset[0] * this.scale / modules.CELL_SIZE,
                                    i = t[1] * this.scale + this.offset[1] * this.scale / modules.CELL_SIZE,
                                    o = this.scale + .05 * this.scale;
                                this.render.drawSolidColor(s, i, o, o)
                            })), this.isSelecting) {
                            this.render.prepareSolidColor(), this.render.setSolidColor(.5, .5, .75, .25);
                            const e = this.selectedMap.getCurrentSelectedArea();
                            if (void 0 !== e) {
                                const t = e[0] * this.scale + this.offset[0] * this.scale / modules.CELL_SIZE,
                                    s = e[1] * this.scale + this.offset[1] * this.scale / modules.CELL_SIZE,
                                    i = e[2] - e[0],
                                    o = e[3] - e[1];
                                this.render.drawSolidColor(t, s, i * this.scale, o * this.scale)
                            }
                        }
                        this.render.disableSolidColor(), this.screenUpdated = !1, this.frame++

            // if (modules.PlayerSettings.patched !== true) return;
            // this.updateFocus();
            // const zodc = this.offset[0] / modules.CELL_SIZE;
            // const oodc = this.offset[1] / modules.CELL_SIZE;
            // const zodcms = zodc * this.scale;
            // const oodcms = oodc * this.scale;
            // const zodcs = ~~(-zodc / 16);
            // const oodcs = ~~(-oodc / 16);
            // const sds = this.scale / 16;
            // const ffms = 0.025 * this.scale;
            // const cffms = 0.05 * this.scale;
            // const zodcmsaf = zodcms + ffms;
            // const oodcmsaf = oodcms + ffms;
            // if (this.drawPastedArrows || 0 !== this.selectedMap.getSelectedArrows().length || modules.PlayerSettings.framesToUpdate[this.updateSpeedLevel] > 1) this.screenUpdated = true;
            // if (this.screenUpdated) this.render.drawBackground(this.scale, [-zodc, -oodc]);
            // this.render.prepareArrows(this.scale);
            // const t = zodcs - 1;
            // const s = oodcs - 1;
            // const o = zodcs + this.width / sds;
            // const a = oodcs + this.height / sds;
            // this.render.setArrowAlpha(1);
            // this.gameMap.chunks.forEach((chunk) => {
            //     if (chunk.x < t || chunk.x > o || chunk.y < s || chunk.y > a) return;
            //     for (let i = 0; i < chunk.arrows.length; i++) {
            //         const arrow = chunk.arrows[i];
            //         if (arrow.type !== 0 && (this.screenUpdated || modules.ChunkUpdates.wasArrowChanged(arrow))) {
            //             const i = arrow.wx * this.scale + zodcmsaf;
            //             const a = arrow.wy * this.scale + oodcmsaf;
            //             this.render.drawArrow(i, a, arrow.type, arrow.signal, arrow.rotation, arrow.flipped, arrow);
            //         }
            //     }
            // });
            // if (performance.now() - this.drawTime > 1e3) {
            //     this.drawTime = performance.now();
            //     this.drawsPerSecond = 0;
            // }
            // this.drawsPerSecond++;
            // if (this.drawPastedArrows) {
            //     this.render.setArrowAlpha(0.5);
            //     const e = this.selectedMap.getCopiedArrows();
            //     if (e.size !== 0) this.screenUpdated = true;
            //     e.forEach((e, t) => {
            //         const [s, i] = t.split(",").map((e) => parseInt(e, 10));
            //         let o = s;
            //         let a = i;
            //         let r = 0;
            //         if (this.pasteDirection === 1) {
            //             o = -i;
            //             a = s;
            //             r = 1;
            //         }
            //         else if (this.pasteDirection === 2) {
            //             o = -s;
            //             a = -i;
            //             r = 2;
            //         }
            //         else if (this.pasteDirection === 3) {
            //             o = i;
            //             a = -s;
            //             r = 3;
            //         }
            //         const l = (o + this.mousePosition[0]) * this.scale + zodcmsaf;
            //         const h = (a + this.mousePosition[1]) * this.scale + oodcmsaf;
            //         this.render.drawArrow(l, h, e.type, e.signal, (e.rotation + r) % 4, e.flipped, e)
            //     });
            // }
            // this.render.disableArrows();
            // this.render.prepareSolidColor();
            // this.render.setSolidColor(0.25, 0.5, 1, 0.25);
            // this.selectedMap.getSelectedArrows().forEach((e) => {
            //     const t = e.split(",");
            //     const s = parseInt(t[0], 10) * this.scale + zodc;
            //     const i = parseInt(t[1], 10) * this.scale + oodc;
            //     const o = this.scale + cffms;
            //     this.render.drawSolidColor(s, i, o, o)
            // });
            // if (this.isSelecting) {
            //     this.render.prepareSolidColor();
            //     this.render.setSolidColor(0.5, 0.5, 0.75, 0.25);
            //     const e = this.selectedMap.getCurrentSelectedArea();
            //     if (e !== null) {
            //         const t = e[0] * this.scale + zodc;
            //         const s = e[1] * this.scale + oodc;
            //         const i = e[2] - e[0]
            //         const o = e[3] - e[1];
            //         this.render.drawSolidColor(t, s, i * this.scale, o * this.scale)
            //     }
            // }
            // this.render.disableSolidColor();
            // this.screenUpdated = false;
            // this.frame++;
        }
    });
    // endregion
})();