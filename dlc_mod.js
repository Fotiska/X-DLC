window.document.addEventListener('fapishowmods', function() {
    window.game.FAPI.ModHandler.showMod('DLC Core', 'Фотис', window.game.FAPI.img_sources.icon);
});

window.document.addEventListener('fapiloaded', function() {
    // regionЛГБТлампочка
    лгбт_подсветочка = new window.game.FAPI.FModArrowType();
    лгбт_подсветочка.id = 0;
    лгбт_подсветочка.name = ['RGB lamp','Разноцветная лампочка','Різнобарвна лампочка','Рознакаляровая лямпа'];
    лгбт_подсветочка.info = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
    лгбт_подсветочка.does = ["Does nothing.","Ничего не делает.","Нічого не робить.","Нічога не рабіць."];
    лгбт_подсветочка.icon_url = window.game.FAPI.img_sources.rgb_lamp;
    лгбт_подсветочка.is_pressable = true;
    лгбт_подсветочка.update = (arrow) => {
        if (arrow.custom_data[0] === 0) arrow.signal = arrow.signalsCount;
        else if (arrow.signalsCount > 0) arrow.signal = arrow.custom_data;
        else arrow.signal = 0;
    };
    лгбт_подсветочка.press = (arrow) => {
        rgb_modal.showModal();
        rgb_select.value = colors[arrow.custom_data[0]]
        rgb_select.onchange = () => arrow.custom_data = [colors.indexOf(rgb_select.value)];
    };
    лгбт_подсветочка.custom_data = [0];


    colors = ['Радужный', 'Красный', 'Синий', 'Жёлтый', 'Зелёный', 'Оранжевый', 'Фиолетовый', 'Чёрный'];
    let rgb_modal = window.game.FAPI.ModalHandler.createModal();
    let rgb_select = window.game.FAPI.ModalHandler.createSelect(rgb_modal, 'Цвет');
    colors.forEach((color) => {
        let rgb_option = window.game.FAPI.ModalHandler.createOption(rgb_select);
        rgb_option.value = color;
        rgb_option.text = color;
    })
    // endregion
    // region ФиолетоваяСтрелка
    purple_arrow = new window.game.FAPI.FModArrowType();
    purple_arrow.id = 1;
    purple_arrow.name = ['Purple arrow','Фиолетовая стрелка','Фіолетова стрілка','Фіялетавая стрэлка'];
    purple_arrow.info = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
    purple_arrow.does = ["Sends a signal forwards, skipping `n` cells.","Передает сигнал вперед через `n` клеток.","Передає сигнал вперед через `n` клітини.","Перадае сігнал наперад праз `n` клеткі."];
    purple_arrow.icon_url = window.game.FAPI.img_sources.purple_arrow;
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
    purple_diagonal_arrow = new window.game.FAPI.FModArrowType();
    purple_diagonal_arrow.id = 2;
    purple_diagonal_arrow.name = ['Purple diagonal arrow','Фиолетовая диагональная стрелка','Фіолетова стрілка','Фіялетавая стрэлка'];
    purple_diagonal_arrow.info = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
    purple_diagonal_arrow.does = ["Sends a signal diagonally, skipping `n` cells.","Передает сигнал по диагонали через `n` клеток.","Передає сигнал вперед через `n` клітини.","Перадае сігнал наперад праз `n` клеткі."];
    purple_diagonal_arrow.icon_url = window.game.FAPI.img_sources.purple_diagonal_arrow;
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

    // TODO: Накопительная стрелка
    // TODO: Рандомизатор в 2 направления

    game.navigation.gamePage.playerUI.toolbarController.inventory.element.appendChild(rgb_modal);
    game.navigation.gamePage.playerUI.toolbarController.inventory.element.appendChild(purple_modal);
    game.navigation.gamePage.playerUI.toolbarController.inventory.element.appendChild(purple_diagonal_modal);

    window.game.FAPI.registerMod('DLC Core', 'fotis.dlc_core', 'Фотис', 'API для мододелов', (mod) => {
        window.game.FAPI.registerArrows([лгбт_подсветочка, purple_arrow, purple_diagonal_arrow], mod);
        console.log('`DLC Core` loaded!');
    });
});