window.document.addEventListener('fapiloaded', function() {
    // regionЛГБТлампочка
    let лгбт_подсветочка = new window.game.FAPI.FModArrowType();
    лгбт_подсветочка.id = 0;
    лгбт_подсветочка.name = ['RGB lamp','Разноцветная лампочка','Різнобарвна лампочка','Рознакаляровая лямпа'];
    лгбт_подсветочка.info = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
    лгбт_подсветочка.does = ["Does nothing.","Ничего не делает.","Нічого не робить.","Нічога не рабіць."];
    лгбт_подсветочка.icon_url = "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/rgb_lamp.png";
    лгбт_подсветочка.is_pressable = true;
    лгбт_подсветочка.update = (arrow) => {
        let [color, activation, transmit] = лгбт_подсветочка.gdata(arrow);

        if (color === 0) arrow.signal = arrow.signalsCount;
        else if (activation === 0 && arrow.signalsCount > 0) arrow.signal = color;
        else if (activation === 1) arrow.signal = color;
        else if (activation === 2 && arrow.signalsCount === 0) arrow.signal = color;
        else arrow.signal = 0;
    };
    лгбт_подсветочка.transmit = (arrow, chunk, x, y) => {
        if (arrow.signal !== 0) {
            let [color, activation, transmit] = лгбт_подсветочка.gdata(arrow);
            if (transmit === 1) window.game.FAPI.SignalUpdater.updateCount(window.game.FAPI.SignalUpdater.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1, 0));
        }
    };
    лгбт_подсветочка.gdata = (arrow) => {
        let transmit = arrow.custom_data[0] & 1;
        let activation = (arrow.custom_data[0] >> 3) & 0b11;
        let color = (arrow.custom_data[0] >> 5) & 0b111;
        return [color, activation, transmit];
    }
    лгбт_подсветочка.sdata = (color, activation, transmit) => {
        let data = (color << 5) | (activation << 3) | transmit;
        return [data];
    }
    лгбт_подсветочка.press = (arrow, is_shift) => {
        rgb_modal.showModal();
        let [color, activation, transmit] = лгбт_подсветочка.gdata(arrow);
        rgb_select.value = colors[color];
        rgb_select.onchange = () => {
            let [color, activation, transmit] = лгбт_подсветочка.gdata(arrow);
            color = colors.indexOf(rgb_select.value);
            arrow.custom_data = лгбт_подсветочка.sdata(color, activation, transmit);
        }
        activation_select.value = activations[activation];
        activation_select.onchange = () => {
            let [color, activation, transmit] = лгбт_подсветочка.gdata(arrow);
            activation = activations.indexOf(activation_select.value);
            arrow.custom_data = лгбт_подсветочка.sdata(color, activation, transmit);
        }
        transmit_select.value = transmits[transmit];
        transmit_select.onchange = () => {
            let [color, activation, transmit] = лгбт_подсветочка.gdata(arrow);
            transmit = transmits.indexOf(transmit_select.value);
            arrow.custom_data = лгбт_подсветочка.sdata(color, activation, transmit);
        }
    };
    лгбт_подсветочка.custom_data = [128];

    colors = ['Радужный', 'Красный', 'Синий', 'Жёлтый', 'Зелёный', 'Оранжевый', 'Фиолетовый', 'Чёрный'];
    activations = ['При сигнале', 'Всегда ( можно блокировать )', 'Когда нету сигнала'];
    transmits = ['Нет', 'Следующей стрелочке'];

    let rgb_modal = window.game.FAPI.ModalHandler.createModal();
    let rgb_select = window.game.FAPI.ModalHandler.createSelect(rgb_modal, 'Цвет');
    window.game.FAPI.ModalHandler.createOptions(rgb_select, colors);
    let activation_select = window.game.FAPI.ModalHandler.createSelect(rgb_modal, 'Активация');
    window.game.FAPI.ModalHandler.createOptions(activation_select, activations);
    let transmit_select = window.game.FAPI.ModalHandler.createSelect(rgb_modal, 'Передача');
    window.game.FAPI.ModalHandler.createOptions(transmit_select, transmits);
    // endregion
    // region ФиолетоваяСтрелка
    let purple_arrow = new window.game.FAPI.FModArrowType();
    purple_arrow.id = 1;
    purple_arrow.name = ['Purple arrow','Фиолетовая стрелка','Фіолетова стрілка','Фіялетавая стрэлка'];
    purple_arrow.info = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
    purple_arrow.does = ["Sends a signal forwards, skipping `n` cells.","Передает сигнал вперед через `n` клеток.","Передає сигнал вперед через `n` клітини.","Перадае сігнал наперад праз `n` клеткі."];
    purple_arrow.icon_url = "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/purple_arrow.png";
    purple_arrow.is_pressable = true;
    purple_arrow.custom_data = [123];
    purple_arrow.update = (arrow) => {
        if (arrow.signalsCount > 0) arrow.signal = 6;
        else arrow.signal = 0;
    };
    purple_arrow.press = (arrow, is_shift) => {
        purple_input.onchange = (e) => arrow.custom_data[0] = purple_input.value;
        purple_input.value = arrow.custom_data[0];
        purple_modal.showModal();
    };
    purple_arrow.transmit = (arrow, chunk, x, y) => {
        if (arrow.signal === 6) {
            let distance = Math.min(Math.max(arrow.custom_data[0], 1), 10);
            window.game.FAPI.SignalUpdater.updateCount(window.game.FAPI.SignalUpdater.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -distance, 0));
        }
        if (arrow.signalsCount === 0) arrow.signal = 0;
    }
    purple_arrow.custom_data = [2];

    let purple_modal = window.game.FAPI.ModalHandler.createModal();
    let purple_input = window.game.FAPI.ModalHandler.createInput(purple_modal, 'Дистанция');
    // endregion
    // region ФиолетоваяДиагональнаяСтрелка
    let purple_diagonal_arrow = new window.game.FAPI.FModArrowType();
    purple_diagonal_arrow.id = 2;
    purple_diagonal_arrow.name = ['Purple diagonal arrow','Фиолетовая диагональная стрелка','Фіолетова стрілка','Фіялетавая стрэлка'];
    purple_diagonal_arrow.info = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
    purple_diagonal_arrow.does = ["Sends a signal diagonally, skipping `n` cells.","Передает сигнал по диагонали через `n` клеток.","Передає сигнал вперед через `n` клітини.","Перадае сігнал наперад праз `n` клеткі."];
    purple_diagonal_arrow.icon_url = "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/purple_diagonal_arrow.png";
    purple_diagonal_arrow.is_pressable = true;
    purple_diagonal_arrow.update = (arrow) => {
        if (arrow.signalsCount > 0) arrow.signal = 6;
        else arrow.signal = 0;
    };
    purple_diagonal_arrow.press = (arrow) => {
        purple_diagonal_input.onchange = (e) => arrow.custom_data[0] = purple_diagonal_input.value;
        purple_diagonal_input.value = arrow.custom_data[0];
        purple_diagonal_modal.showModal();
    };
    purple_diagonal_arrow.transmit = (arrow, chunk, x, y) => {
        if (arrow.signal === 6) {
            let distance = Math.min(Math.max(arrow.custom_data[0], 1), 10);
            window.game.FAPI.SignalUpdater.updateCount(window.game.FAPI.SignalUpdater.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -distance, distance));
        }
        if (arrow.signalsCount === 0) arrow.signal = 0;
    }
    purple_diagonal_arrow.custom_data = [2];


    let purple_diagonal_modal = window.game.FAPI.ModalHandler.createModal();
    let purple_diagonal_input = window.game.FAPI.ModalHandler.createInput(purple_diagonal_modal, 'Дистанция');
    // endregion
    // region БлокТекста
    let symbols = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!?\"\`\'#()[].,_- \n'.split('');
    let text_block = new window.game.FAPI.FModArrowType();
    text_block.id = 3;
    text_block.name = ['Block of text','Блок текста','Блок текста','Блок текста'];
    text_block.info = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
    text_block.does = ["Sends a signal diagonally, skipping `n` cells.","Передает сигнал по диагонали через `n` клеток.","Передає сигнал вперед через `n` клітини.","Перадае сігнал наперад праз `n` клеткі."];
    text_block.icon_url = "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/text_block.png";
    text_block.is_pressable = true;
    text_block.text2seq = function(text) {
        let seq = [];
        text.split('').forEach((symbol) => {
            let index = symbols.indexOf(symbol);
            if (index !== -1) seq.push(index);
        });
        return seq;
    }
    text_block.seq2text = function(seq) {
        let text = '';
        seq.forEach((val) => {
            text += symbols[val];
        });
        return text;
    }
    text_block.press = (arrow) => {
        text_block_input.onchange = (e) => arrow.custom_data = text_block.text2seq(text_block_input.value);
        text_block_input.value = text_block.seq2text(arrow.custom_data);
        text_block_modal.showModal();
    };
    text_block.custom_data = [text_block.text2seq('Пусто')];


    let text_block_modal = window.game.FAPI.ModalHandler.createModal();
    let text_block_input = window.game.FAPI.ModalHandler.createTextInput(text_block_modal, 'Текст');
    // endregion

    // TODO: Накопительная стрелка
    // TODO: Рандомизатор в 2 направления

    game.navigation.gamePage.playerUI.toolbarController.inventory.element.appendChild(rgb_modal);
    game.navigation.gamePage.playerUI.toolbarController.inventory.element.appendChild(purple_modal);
    game.navigation.gamePage.playerUI.toolbarController.inventory.element.appendChild(purple_diagonal_modal);
    game.navigation.gamePage.playerUI.toolbarController.inventory.element.appendChild(text_block_modal);

    window.game.FAPI.registerMod('DLC Core', 'fotis.dlc_core', 'Фотис', 'API для мододелов', (mod) => {
        window.game.FAPI.registerArrows([лгбт_подсветочка, purple_arrow, purple_diagonal_arrow, text_block], mod);
        console.log('`DLC Core` loaded!');
    });
});