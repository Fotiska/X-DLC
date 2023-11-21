(async () => {
    class FMod {
        constructor() {
            this.id = -1;
            this.idname = 'unknown.unknown';
            this.name = 'Unknown';
            this.author = 'Unknown';
            this.description = 'Unknown';
            this.arrows = {};
        }
    }
    class FModArrow {
        constructor() {
            this.type = 0;
            this.id = 0;
            this.name = [];
            this.info = [];
            this.does = [];
            this.mod = null;
            this.icon_url = "";
            this.is_pressable = false;
            this.custom_data = [];

            this.update = (arrow) => arrow.signal = 0;
            this.press = (arrow) => undefined;
            this.transmit = (arrow) => undefined;
            this.block = (arrow) => undefined;
        }
    }
    class SignalUpdater {
        /**
         * @param {FAPI} FAPI
         */
        constructor(FAPI) {
            this.FAPI = FAPI;
        }
        /**
         * Перенос текущих значений стрелочки в старые
         * @param {Object.<string,any>} arrow Стрелочка
         */
        toLast = function(arrow) {
            arrow.lastType = arrow.type;
            arrow.lastSignal = arrow.signal;
            arrow.lastRotation = arrow.rotation;
            arrow.lastFlipped = arrow.flipped;
        }
        /**
         * Добавляет единицу к количеству сигналов полученной стрелочки
         * @param {Object.<string,any> | void} arrow Стрелочка
         */
        updateCount = function(arrow) {
            if (arrow !== undefined) arrow.signalsCount += 1;
        }
        /**
         * Блокирует сигнал полученной стрелочки
         * <br><b>Вызывать не в `transmit` а в `block` иначе не будет никакого эффекта!</b>
         * @param {Object.<string,any> | void} arrow Стрелочка
         */
        blockSignal = function(arrow) {
            if (arrow !== undefined) arrow.signal = 0;
        }
        /**
         * Сложный вариант получения стрелочки
         * @param {Object.<string,any>} chunk - Чанк
         * @param {number} x Позиция по X
         * @param {number} y Позиция по Y
         * @param {number} rotation Поворот стрелочки ( 0 вверх | 1 вправо | 2 вниз | 3 влево )
         * @param {boolean} flipped Зеркально расположена или нет
         * @param {number} distance Дистанция от стрелочки ( отрицательное = вперёд | положительное = назад )
         * @param {number} diagonal Дистанция от стрелочки в сторону ( отрицательное = вправо | положительное = влево )
         * @return {Object.<string,any> | void} Возвращает стрелочку если находит её, а иначе `null`
         */
        adv_getArrowAt = function(chunk, x, y, rotation, flipped, distance=-1, diagonal=0) {
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

            let l = chunk;
            if (x >= this.FAPI.CHUNK_SIZE) {
                if (y >= this.FAPI.CHUNK_SIZE) {
                    l = chunk.adjacentChunks[3];
                    x -= this.FAPI.CHUNK_SIZE;
                    y -= this.FAPI.CHUNK_SIZE;
                }
                else if (y < 0) {
                    l = chunk.adjacentChunks[1];
                    x -= this.FAPI.CHUNK_SIZE;
                    y += this.FAPI.CHUNK_SIZE;
                }
                else {
                    l = chunk.adjacentChunks[2];
                    x -= this.FAPI.CHUNK_SIZE;
                }
            }
            else if (x < 0) {
                if (y < 0) {
                    l = chunk.adjacentChunks[7];
                    x += this.FAPI.CHUNK_SIZE;
                    y += this.FAPI.CHUNK_SIZE;
                } else if (y >= this.FAPI.CHUNK_SIZE) {
                    l = chunk.adjacentChunks[5];
                    x += this.FAPI.CHUNK_SIZE;
                    y -= this.FAPI.CHUNK_SIZE;
                } else {
                    l = chunk.adjacentChunks[6];
                    x += this.FAPI.CHUNK_SIZE;
                }
            }
            else if (y < 0) {
                l = chunk.adjacentChunks[0];
                y += this.FAPI.CHUNK_SIZE;
            }
            else if (y >= this.FAPI.CHUNK_SIZE) {
                l = chunk.adjacentChunks[4];
                y -= this.FAPI.CHUNK_SIZE;
            }
            if (l !== undefined) return l.getArrow(x, y);
        }
        // /**
        //  * Упрощённый вариант получения стрелочки
        //  * @param {Object.<string,any>} arrow Стрелочка
        //  * @param {number} distance Дистанция от стрелочки ( отрицательное = вперёд | положительное = назад )
        //  * @param {number} diagonal Дистанция от стрелочки в сторону ( отрицательное = вправо | положительное = влево )
        //  * @return {Object.<string,any> | void} Возвращает стрелочку если находит её, а иначе `null`
        //  */
        // getArrowAt(arrow, distance=-1, diagonal=0) {
        //
        // }
        /**
         * Обновление сигналов стрелочек
         * @param {Object.<string,any>} gameMap Карта
         * @return {void} Ничего не возвращает
         */
        update = function(gameMap) {
            gameMap.chunks.forEach((chunk) => {
                for (let x = 0; x < this.FAPI.CHUNK_SIZE; x++) {
                    for (let y = 0; y < this.FAPI.CHUNK_SIZE; y++) {
                        const arrow = chunk.getArrow(x, y);
                        this.toLast(arrow);
                        switch (arrow.type) {
                            case 0:
                                break;
                            case 1: // Стрелочка
                            case 4: // Стрелочка задержки
                            case 5: // Передатчик
                            case 22: // Стрелочка из уровня #1
                                if (arrow.signal === 1) this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped));
                                break;
                            case 2: // Источник
                            case 9: // Тактовый источник
                                if (arrow.signal === 1) {
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 0, 1));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 1, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 0, -1));
                                }
                                break;
                            case 6: // <>
                                if (arrow.signal === 1) {
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 1, 0));
                                }
                                break;
                            case 7: // ^>
                                if (arrow.signal === 1) {
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 0, 1));
                                }
                                break;
                            case 8: // <^>
                                if (arrow.signal === 1) {
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 0, 1));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 0, -1));
                                }
                                break;
                            case 10: // Синяя стрелочка
                                if (arrow.signal === 2) this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -2))
                                break;
                            case 11: // Диагональная стрелочка
                                if (arrow.signal === 2) this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 1))
                                break;
                            case 12: // Синий курсор
                                if (arrow.signal === 2) {
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -2, 0));
                                }
                                break;
                            case 13: // Полусиний курсор
                                if (arrow.signal === 2) {
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -2, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 0, 1));
                                }
                                break;
                            case 14: // Синий курсор ЛКМ
                                if (arrow.signal === 2) {
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 1));
                                }
                                break;
                            case 15: // НЕ
                            case 16: // И
                            case 17: // Хуйня какая та
                            case 18: // Ячейка памяти
                            case 19: // И + Ячейка памяти
                                if (arrow.signal === 3) this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped))
                                break;
                            case 20: // Рандомизатор
                            case 24: // Направленная кнопка
                                if (arrow.signal === 5) this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped));
                                break;
                            case 21: // Кнопка
                                if (arrow.signal === 5) {
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 0, 1));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 1, 0));
                                    this.updateCount(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 0, -1));
                                }
                                break;
                            default:
                                let marrow = this.FAPI.getArrowByType(arrow.type);
                                if (marrow !== undefined) marrow.transmit(arrow, chunk, x, y);
                                break;
                        }
                    }
                }
            });
            gameMap.chunks.forEach((chunk) => {
                for (let x = 0; x < this.FAPI.CHUNK_SIZE; x++) {
                    for (let y = 0; y < this.FAPI.CHUNK_SIZE; y++) {
                        const arrow = chunk.getArrow(x, y);
                        switch (arrow.type) {
                            case 0:
                                break;
                            case 1:
                            case 3:
                            case 6:
                            case 7:
                            case 8:
                            case 23:
                                arrow.signal = arrow.signalsCount > 0 ? 1 : 0;
                                break;
                            case 2:
                                arrow.signal = 1;
                                break;
                            case 4:
                                if (arrow.signal === 2) arrow.signal = 1;
                                else if (arrow.signal === 0 && arrow.signalsCount > 0) arrow.signal = 2;
                                else if (arrow.signal === 1 && arrow.signalsCount > 0) arrow.signal = 1;
                                else arrow.signal = 0;
                                break;
                            case 5:
                                arrow.signal = 0;
                                const backward_arrow = this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, 1);
                                if (backward_arrow !== undefined) arrow.signal = backward_arrow.lastSignal !== 0 ? 1 : 0;
                                break;
                            case 9:
                                if (arrow.signal === 0) arrow.signal = 1;
                                else if (arrow.signal === 1) arrow.signal = 2;
                                break;
                            case 10:
                            case 11:
                            case 12:
                            case 13:
                            case 14:
                                arrow.signal = arrow.signalsCount > 0 ? 2 : 0;
                                break;
                            case 15:
                                arrow.signal = arrow.signalsCount > 0 ? 0 : 3;
                                break;
                            case 16:
                                arrow.signal = arrow.signalsCount > 1 ? 3 : 0;
                                break;
                            case 17:
                                arrow.signal = arrow.signalsCount % 2 === 1 ? 3 : 0;
                                break;
                            case 18:
                                if (arrow.signalsCount > 1) arrow.signal = 3;
                                else if (arrow.signalsCount === 1) arrow.signal = 0;
                                break;
                            case 19:
                                if (arrow.signalsCount > 0) arrow.signal = arrow.signal === 3 ? 0 : 3;
                                break;
                            case 20:
                                arrow.signal = (arrow.signalsCount > 0 && Math.random() < 0.5) ? 5 : 0;
                                break;
                            case 21:
                                arrow.signal = 0;
                                break;
                            case 22:
                                arrow.signal = arrow.signalsCount > 0 ? 1 : 0;
                                const n = chunk.getLevelArrow(x, y);
                                if (n !== null) n.update();
                                break;
                            case 24:
                                arrow.signal = arrow.signalsCount > 0 ? 5 : 0;
                                break;
                            default:
                                let marrow = this.FAPI.getArrowByType(arrow.type);
                                if (marrow !== undefined) marrow.update(arrow);
                                break;
                        }
                        arrow.signalsCount = 0;
                    }
                }
            });
            gameMap.chunks.forEach((chunk) => {
                for (let x = 0; x < this.FAPI.CHUNK_SIZE; x++) {
                    for (let y = 0; y < this.FAPI.CHUNK_SIZE; y++) {
                        const arrow = chunk.getArrow(x, y);
                        if (arrow.type === 3 && arrow.lastSignal === 1)
                            this.blockSignal(this.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped));
                        else if (arrow.type > 24) {
                            let marrow = this.FAPI.getArrowByType(arrow.type);
                            if (marrow !== undefined) marrow.block(arrow, chunk, x, y);
                        }
                    }
                }
            });
            gameMap.chunks.forEach((chunk) => {
                for (let x = 0; x < this.FAPI.CHUNK_SIZE; x++) {
                    for (let y = 0; y < this.FAPI.CHUNK_SIZE; y++) {
                        const arrow = chunk.getArrow(x, y);
                        if (arrow.type === 23) chunk.update();
                    }
                }
            });
        }
    }
    class AtlasModifier {
        constructor() {
            this.arrowsToAdd = [];
            this.isAtlasModifying = false;
        }
        appendArrow(index, texture) {
            this.arrowsToAdd.push([index, texture]);
            console.log(`Arrow with id \`${index}\` registered`)
            if (!this.isAtlasModifying) {
                console.log('Atlas is being to be modified')
                this.startAtlasModifying();
            }
        }
        startAtlasModifying() {
            let atlasModifier = this;
            function repeat() {
                if (atlasModifier.arrowsToAdd.length === 0) {
                    game.PlayerSettings.arrowAtlasImage.onload = () => game.navigation.gamePage.game.render.createArrowTexture(game.PlayerSettings.arrowAtlasImage);
                    atlasModifier.isAtlasModifying = false;
                    return;
                }
                let pair = atlasModifier.arrowsToAdd.pop(0);
                let index = pair[0];
                let src = pair[1];

                let x = (index - 1) % 8;
                let y = ~~(index / 8);
                const img1 = new Image();
                const img2 = new Image();
                img1.src = game.PlayerSettings.arrowAtlasImage.src;
                img2.src = src;
                img2.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = img1.width;
                    canvas.height = img1.height;

                    ctx.drawImage(img1, 0, 0);
                    ctx.drawImage(img2, x * 256, y * 256);

                    game.PlayerSettings.arrowAtlasImage = new Image;
                    game.PlayerSettings.arrowAtlasImage.src = canvas.toDataURL('image/png');
                    repeat()
                };
            }
            this.isAtlasModifying = true;
            repeat();
        }
    }
    class DataHandler {
        constructor(FAPI) {
            this.FAPI = FAPI;
            let dataHandler = this;
            game.load.load = function(gameMap, data) {
                dataHandler.load(gameMap, data);
            };
            game.save.save = function(gameMap) {
                return dataHandler.save(gameMap);
            };
            game.navigation.gamePage.game.selectedMap.__proto__.copyFromGameMap = function(gameMap) {
                game.navigation.gamePage.playerControls.activeCustomData = undefined;
                return dataHandler.copyFromGameMap(game.navigation.gamePage.game.selectedMap, gameMap);
            }
            game.navigation.gamePage.game.selectedMap.__proto__.pasteFromText = function(data, on_loaded, on_error) {
                return dataHandler.pasteFromText(game.navigation.gamePage.game.selectedMap, data, on_loaded, on_error);
            }
            game.navigation.gamePage.playerControls.prevSetArrows = game.navigation.gamePage.playerControls.setArrows;
            game.navigation.gamePage.playerControls.setArrows = function(e, t) {
                if (!game.navigation.gamePage.playerControls.playerAccess.canSetArrows) return;
                game.navigation.gamePage.playerControls.prevSetArrows(e, t);
                dataHandler.setArrows(game.navigation.gamePage.playerControls, e, t)
            }
            game.navigation.gamePage.playerControls.prevPickArrow = game.navigation.gamePage.playerControls.pickArrow;
            game.navigation.gamePage.playerControls.pickArrow = function() {
                game.navigation.gamePage.playerControls.prevPickArrow();
                dataHandler.pickArrow(game.navigation.gamePage.playerControls);
            }
            game.navigation.gamePage.playerControls.game.selectedMap.prevSetArrow = game.navigation.gamePage.playerControls.game.selectedMap.setArrow;
            game.navigation.gamePage.playerControls.game.selectedMap.setArrow = function(type) {
                game.navigation.gamePage.playerControls.game.selectedMap.prevSetArrow(type);
                dataHandler.setArrow(game.navigation.gamePage.playerControls, type);
            }
        }

        save(gameMap) {
            const data = [];
            data.push(255); // Конец обозначений модов
            const savedModsOrder = []
            this.FAPI.mods.forEach((mod) => {
                if (data.length !== 1) data.push(254);
                mod.idname.split('').forEach((symbol) => {
                    data.push(this.FAPI.ID_SYMBOLS.indexOf(symbol));
                })
                savedModsOrder.push(mod);
            });
            data.push(255); // Конец обозначений модов
            data.push(0, 0); // ВЕРСИЯ ИГРЫ ( НЕ МЕНЯЕТСЯ )
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
                    const isFromMod = arrowType > 24;
                    if (isFromMod) {
                        data.push(255); // Обозначение что это стрелочка из мода
                        let marrow = this.FAPI.getArrowByType(arrowType);
                        data.push(marrow.id); // Айди стрелочки из мода
                        data.push(savedModsOrder.indexOf(marrow.mod)); // Индекс мода из `обозначения модов`
                    }
                    else data.push(arrowType);
                    data.push(0);
                    const n = data.length - 1;
                    let o = 0;
                    for (let x = 0; x < this.FAPI.CHUNK_SIZE; x++) {
                        for (let y = 0; y < this.FAPI.CHUNK_SIZE; y++) {
                            const arrow = chunk.getArrow(x, y);
                            if (arrow.type === arrowType) {
                                const e = x | y << 4;
                                const s = arrow.rotation | (arrow.flipped ? 1 : 0) << 2;
                                data.push(e);
                                data.push(s);
                                if (isFromMod) {
                                    if (arrow.custom_data === undefined) arrow.custom_data = [];
                                    data.push(arrow.custom_data.length); // Длина данных стрелочки
                                    data.push(...arrow.custom_data); // Данные стрелочки
                                }
                                o++;
                            }
                        }
                    }
                    data[n] = o - 1;
                });
            })
            return data;
        }
        copyFromGameMap(selectedMap, gameMap) {
            selectedMap.rotationState = 0;
            selectedMap.flipState = false;
            selectedMap.arrowsToPutOriginal.clear();
            selectedMap.arrowsToPut.clear();

            let t = Number.MAX_SAFE_INTEGER
            let s = Number.MAX_SAFE_INTEGER;
            selectedMap.tempMap.clear(),
            selectedMap.selectedArrows.forEach((sarrow) => {
                    const [n, o] = sarrow.split(",").map((e => parseInt(e, 10)));
                    const arrow = gameMap.getArrow(n, o);
                    if (arrow !== undefined && arrow.canBeEdited) {
                        t = Math.min(t, n);
                        s = Math.min(s, o);
                    }
                }
            );
            selectedMap.selectedArrows.forEach((sarrow) => {
                    const [n, o] = sarrow.split(",").map((e=>parseInt(e, 10)));
                    const a = n - t;
                    const r = o - s;
                    const arrow = gameMap.getArrow(n, o);
                    if (arrow !== undefined && arrow.canBeEdited) {
                        selectedMap.tempMap.setArrowType(a, r, arrow.type);
                        selectedMap.tempMap.setArrowRotation(a, r, arrow.rotation);
                        selectedMap.tempMap.setArrowFlipped(a, r, arrow.flipped);
                        this.FAPI.setArrowCustomData(selectedMap.tempMap, a, r, arrow.custom_data);
                    }
                }
            );
            const i = (0, window.game.save.save)(selectedMap.tempMap);
            return window.game.Utils.arrayBufferToBase64(i);
        }
        pickArrow(controls) {
            const e = controls.getArrowByMousePosition();
            if (e !== undefined) game.navigation.gamePage.playerControls.activeCustomData = e.custom_data;
            else game.navigation.gamePage.playerControls.activeCustomData = -1;
        }
        setArrow(controls, type) {
            controls.activeCustomData = this.FAPI.getArrowByType(type).custom_data;
        }
        pasteFromText(selectedMap, data, on_loaded, on_error) {
            selectedMap.tempMap.clear();
            try {
                const s = window.atob(data).split("").map((e) => e.charCodeAt(0));
                (0, window.game.load.load)(selectedMap.tempMap, s);
                if (selectedMap.tempMap.chunks.size === 0) throw new Error("No chunks found");
                on_loaded();
            } catch (e) {
                on_error();
            }
            selectedMap.arrowsToPutOriginal.clear();
            selectedMap.arrowsToPut.clear();
            selectedMap.tempMap.chunks.forEach((chunk) => {
                    for (let t = 0; t < this.FAPI.CHUNK_SIZE; t++) {
                        for (let s = 0; s < this.FAPI.CHUNK_SIZE; s++) {
                            const i = chunk.getArrow(t, s);
                            if (0 !== i.type && i.canBeEdited) {
                                const n = chunk.x * this.FAPI.CHUNK_SIZE + t
                                const o = chunk.y * this.FAPI.CHUNK_SIZE + s;
                                selectedMap.arrowsToPutOriginal.set(`${n},${o}`, i),
                                selectedMap.arrowsToPut.set(`${n},${o}`, i)
                            }
                        }
                    }
                }
            );
        }
        setArrows(controls, e, t) {
            controls.game.selectedMap.getCopiedArrows().forEach(((s, i)=>{
                if (game.PlayerSettings.levelArrows.includes(s.type))
                    return;
                const [n, o] = i.split(",").map((e) => parseInt(e, 10));
                if (controls.activeCustomData !== -1 && controls.activeCustomData !== undefined)
                    this.FAPI.setArrowCustomData(controls.game.gameMap, e + n, t + o, controls.activeCustomData);
                else this.FAPI.setArrowCustomData(controls.game.gameMap, e + n, t + o, s.custom_data);
            }
            ));
        }
        original_load(gameMap, data) {
            if (data.length < 4) return;
            let s = 0;

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
                    const type = data[s++];
                    const count = data[s++] + 1;

                    for (let adata = 0; adata < count; adata++) {
                        const i = data[s++];
                        const n = data[s++];
                        const arrow = chunk.getArrow(15 & i, i >> 4);
                        arrow.type = type;
                        arrow.rotation = 3 & n;
                        arrow.flipped = 0 !== (4 & n);
                    }
                }
            }
        }
        modded_load(gameMap, data) {
            console.log('Modded load')
            if (data.length < 4) return;
            let s = 1;
            let si = data[s++];
            let modsDefine = [];
            let unknownMods = [];
            let modDefine = '';

            while (si !== 255) {
                if (si === 254) {
                    let mod = this.FAPI.getModByIdName(modDefine);
                    if (mod === undefined) unknownMods.push(modDefine);
                    modsDefine.push(mod);
                    modDefine = '';
                    si = data[s++];
                    continue;
                }
                modDefine += this.FAPI.ID_SYMBOLS[si];
                si = data[s++];
            }
            if (modDefine !== '') {
                let mod = this.FAPI.getModByIdName(modDefine)
                if (mod === undefined) unknownMods.push(modDefine);
                modsDefine.push(mod);
            }

            if (unknownMods.length !== 0) {
                let text = 'Невозможно загрузить карту, отстутствуют данные моды:\n';
                console.log(unknownMods)
                unknownMods.forEach((mod) => {
                    text += mod + '\n';
                });
                alert(text);
                window.open('https://logic-arrows.io/maps');
                window.close();
                throw new Error('Unknown mods');
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
                            arrow.custom_data = cd;
                        }
                        arrow.type = type;
                        arrow.rotation = 3 & n;
                        arrow.flipped = 0 !== (4 & n);
                    }
                }
            }
        }
        load(gameMap, data) {
            if (data.length < 4) return;
            if (data[0] !== 255) this.original_load(gameMap, data);
            else this.modded_load(gameMap, data);
        }
    }
    class ModalHandler {
        constructor(FAPI) {
            this.FAPI = FAPI;
            this.modals = [];
        }

        createModal() {
            let modal = document.createElement('dialog');
            modal.classList.add('ui-mod-modal');
            window.API.main.modals.push(modal);
            return modal;
        }

        openedAnyModal() {
            let opened = false;
            window.API.main.modals.forEach((modal) => {
                if (modal !== undefined) opened = opened || modal.open;
            })
            return opened;
        }

        closeAnyModal() {
            let closed = false;
            window.API.main.modals.forEach((modal) => {
                if (modal !== undefined && modal.open) {
                    modal.close();
                    closed = true;
                }
            });
            return closed;
        }

        createInput(modal, sname, min=1, max=10) {
            let pair = document.createElement('div');
            pair.classList.add('ui-mod-pair');
            modal.appendChild(pair);
            let name = document.createElement('div');
            name.classList.add('ui-mod-name');
            name.textContent = sname;
            pair.appendChild(name);
            let input = document.createElement('input');
            input.type = 'number'
            input.placeholder = `От ${min} до ${max} ( Включительно )`
            input.min = min;
            input.max = max;
            input.classList.add('ui-mod-input');
            pair.appendChild(input);
            return input;
        }

        createSelect(modal, sname) {
            let pair = document.createElement('div');
            pair.classList.add('ui-mod-pair');
            modal.appendChild(pair);
            let name = document.createElement('div');
            name.classList.add('ui-mod-name');
            name.textContent = sname;
            pair.appendChild(name);
            let select = document.createElement('select');
            select.classList.add('ui-mod-select');
            pair.appendChild(select);
            return select;
        }

        createOption(select) {
            let option = document.createElement('option');
            option.classList.add('ui-mod-option');
            select.appendChild(option)
            return option;
        }
    }
    class ModHandler {
        constructor(FAPI) {
            this.FAPI = FAPI;
            this.show = [];
            (async () => {
                while (true) {
                    this.menu_content = document.querySelector('#menu-page-content');
                    if (this.menu_content === null) {
                        await new Promise(resolve => setTimeout(resolve, 10));
                        continue;
                    }
                    break;
                }

                let menu_main = this.menu_content.parentElement;
                let side_element = document.createElement('div');
                side_element.className = 'page-content';

                let side_mods = document.createElement('div');
                side_mods.className = 'side-element-mods';

                let title = document.createElement('div');
                title.className = 'side-element-mods-title';
                title.textContent = 'Загруженные моды:';

                side_mods.appendChild(title)
                side_element.appendChild(this.menu_content)
                side_element.appendChild(side_mods);

                // side_element.onclick = () => {
                //     this.menu_content.innerHTML = '';
                //     document.querySelector('.side-menu-element-selected').className = 'side-menu-element';
                //     window.game.navigation.modsOpened = true;
                // }
                menu_main.appendChild(side_element);
                this.side_mods = side_mods;

                window.document.dispatchEvent(new CustomEvent('fapishowmods'));
            })();
        }
        showMod(name, author, icon) {
            if (this.side_mods === undefined) return;

            let mod_element = document.createElement('div');
            mod_element.className = 'mod';

            let mod_header = document.createElement('div');
            mod_header.className = 'mod-header';

            let mod_icon = document.createElement('img');
            mod_icon.className = 'mod-icon';
            mod_icon.src = icon;

            let mod_name = document.createElement('div');
            mod_name.className = 'mod-name';
            mod_name.textContent = name + ' от ' + author;

            mod_header.appendChild(mod_icon);
            mod_header.appendChild(mod_name);
            mod_element.appendChild(mod_header);
            this.side_mods.appendChild(mod_element);
        }
    }

    class FAPI {
        constructor() {
            window.game.FAPI = this;
            this.ID_SYMBOLS = 'abcdefghijklmnopqrstuvwxyz_.'.split('');
            this.img_sources = JSON.parse(sessionStorage.api_sources);
            this.CHUNK_SIZE = 16;
            this.CELL_SIZE = 250;
            this.MAX_TYPE = 25;
            this.FModArrowType = FModArrow;
            this.AtlasModifier = new AtlasModifier(this);
            this.SignalUpdater = new SignalUpdater(this);
            this.ModalHandler = new ModalHandler(this);
            this.mods = [];
            this.moddedArrowsType = [];
            this.moddedArrowsId = [];
            this.moddedArrows = [];
            this.ModHandler = new ModHandler(this);
        }

        init() {
            let fapi = this;
            this.DataHandler = new DataHandler(this);
            // region Overrides
            game.navigation.gamePage.playerUI.toolbarController.uiToolbar.items[0].__proto__.setImage = function(id) {
                if (id < 24) this.image.src = `res/sprites/arrow${id + 1}.png?v=${game.PlayerSettings.version}`;
                else {
                    let marrow = fapi.getArrowByType(id + 1);
                    if (marrow !== undefined) this.image.src = marrow.icon_url;
                }
            }
            game.ChunkUpdates.update = (gameMap) => {this.SignalUpdater.update(gameMap)};

            let prevControls = game.navigation.gamePage.playerControls.update;
            let prevLeftClickCallback = game.navigation.gamePage.playerControls.leftClickCallback;
            let prevKeyDownCallback = game.navigation.gamePage.playerControls.keyDownCallback;
            game.navigation.gamePage.playerControls.keyDownCallback = function(e, t) {
                if (e === "Escape" && fapi.closeAnyModal()) return;
                prevKeyDownCallback.apply(game.navigation.gamePage.playerControls, e, t);
                // TODO: Возможность подписаться на ивент
            }
            game.navigation.gamePage.playerControls.leftClickCallback = function() {
                if (game.navigation.gamePage.playerControls.playerUI.isMenuOpen()) return;

                prevLeftClickCallback.apply(game.navigation.gamePage.playerControls);
                const arrow = game.navigation.gamePage.playerControls.getArrowByMousePosition();
                const shiftPressed = game.navigation.gamePage.playerControls.keyboardHandler.getShiftPressed();

                if (arrow !== undefined && game.navigation.gamePage.playerControls.freeCursor) {
                    // TODO: Потом сделать чтобы с зажатым шифтом открывались настройки всех выделенных стрелочек
                    if (arrow.type > 24) {
                        let marrow = fapi.getArrowByType(arrow.type);
                        if (marrow !== undefined) marrow.press(arrow, shiftPressed);
                    }
                }
            }
            game.navigation.gamePage.playerControls.mouseHandler.leftClickCallback = game.navigation.gamePage.playerControls.leftClickCallback;
            game.navigation.gamePage.playerControls.update = function() {
                prevControls.apply(game.navigation.gamePage.playerControls);
                const arrow = game.navigation.gamePage.playerControls.getArrowByMousePosition();
                if (arrow !== undefined && arrow.type > 24) {
                    let marrow = fapi.getArrowByType(arrow.type);
                    if (marrow !== undefined) document.body.style.cursor = marrow.is_pressable ? 'pointer' : 'default';
                }
            }
            // endregion

            window.document.dispatchEvent(new CustomEvent('fapimodloading'));
            try {
                const t = window.atob(game.navigation.gamePage.mapInfo.data).split("").map((e) => e.charCodeAt(0));
                (0, window.game.load.load)(game.navigation.gamePage.game.gameMap, t)
            } catch (e) {
                console.error("Failed to load the map", e)
            }
        }

        setArrowCustomData(tempMap, x, y, custom_data) {
            const arrow = tempMap.getArrowForEditing(x, y);
            if (arrow !== undefined && arrow.type !== 0) {
                if (!arrow.canBeEdited) return;
                if (game.PlayerSettings.levelArrows.includes(arrow.type)) return;
                arrow.custom_data = custom_data;
            }
        }
        /**
         * @param {number} type Айди стрелочки
         * @return {FModArrow} Стрелочку из мода
         */
        getArrowByType = function(type) {
            let arrow;
            this.moddedArrows.forEach((farrow) => {
                if (farrow.type === type) arrow = farrow;
            });
            return arrow;
        }
        /**
         * @param {number} id Айди мода
         * @return {FMod} Мод
         */
        getModById(id) {
            let mod;
            this.mods.forEach((fmod) => {
                if (fmod.id === id) mod = fmod;
            });
            return mod;
        }
        /**
         * @param {string} idname Айди ( текстовое ) мода
         * @return {FMod} Мод
         */
        getModByIdName(idname) {
            let mod;
            this.mods.forEach((fmod) => {
                if (fmod.idname === idname) mod = fmod;
            });
            return mod;
        }
        registerMod(name, idname, author, description, on_registered) {
            let regex = /^[a-z._]+$/;
            if (!regex.test(idname)) {
                console.log(`Can\`not load mod, incorrect id: \`${idname}\``);
                return;
            }
            let mod = new FMod();
            mod.id = this.mods.length;
            mod.name = name;
            mod.idname = idname;
            mod.author = author;
            mod.description = description;
            this.mods.push(mod);
            console.log(`Mod \`${idname}\` registered`)
            on_registered(mod);
        }
        registerArrows(arrows, mod) {
            let arrowGroup = []
            let line = document.createElement('div');
            line.className = 'ui-inventory-line';

            arrows.forEach((arrow) => {
                let arrow_id = this.MAX_TYPE++;
                arrowGroup.push(arrow_id);
                arrow.type = arrow_id;
                this.moddedArrows.push(arrow);
                mod.arrows[arrow.id] = arrow;
                arrow.mod = mod;
                let item = document.createElement('div');
                item.className = 'inventory-item';
                item.onclick = () => { game.navigation.gamePage.playerUI.toolbarController.inventory.selectCallback(arrow_id) }
                let img = document.createElement('img');
                img.src = arrow.icon_url;
                item.appendChild(img);
                line.appendChild(item);
                this.AtlasModifier.appendArrow(arrow_id, arrow.icon_url);
            });
            game.navigation.gamePage.playerUI.toolbarController.inventory.itemsBlock.appendChild(line);
            game.navigation.gamePage.playerUI.toolbarController.arrowGroups.push(arrowGroup);
        }
        closeAnyModal = function() {
            return false;
        }
    }

    while (true) {
        let x;
        try {
            x = window.game.navigation;
            break;
        } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    console.log('FAPI Loaded');
    new FAPI();

    while (true) {
        let x;
        try {
            x = window.game.navigation.gamePage.playerUI.toolbarController.inventory.itemsBlock;
            x = window.game.navigation.gamePage.playerUI.toolbarController.inventory.selectedCallback;
            break;
        } catch (e) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
    }
    window.document.dispatchEvent(new CustomEvent('fapiloaded'));

    window.game.FAPI.init();
})();