(() => {
    window.document.addEventListener('fapishowmods', function() {
        window.game.FAPI.ModHandler.showMod('Название', 'Автор', "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/purple_diagonal_arrow.png"); // Отобразить мод в меню
    });

    window.document.addEventListener('fapiloaded', function() {
        стрелочка = new window.game.FAPI.FModArrowType();
        стрелочка.id = 0; // Айди стрелочки в самом моде
        // `name`, `info`, `does` Не обязательны ибо сейчас в гайде не показывается информация о стрелочке
        стрелочка.name = ['Purple diagonal arrow','Фиолетовая диагональная стрелка','Фіолетова стрілка','Фіялетавая стрэлка'];
        стрелочка.info = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
        стрелочка.does = ["Sends a signal diagonally, skipping `n` cells.","Передает сигнал по диагонали через `n` клеток.","Передає сигнал вперед через `n` клітини.","Перадае сігнал наперад праз `n` клеткі."];
        стрелочка.icon_url = "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/purple_diagonal_arrow.png"; // Текстурка стрелочки (250x250) ( берёте с гитхаба )
        стрелочка.is_pressable = true; // Может ли стрелочка нажиматься ( true = да | false = нет )
        стрелочка.update = (arrow) => {
            if (arrow.signalsCount > 0) arrow.signal = 6;
            else arrow.signal = 0;
            // Если на стрелочку идёт более чем 0 сигналов то активировать фиолетовый сигнал
        }; // `update` вызывается раньше чем `transmit`
        стрелочка.transmit = (arrow, chunk, x, y) => {
            if (arrow.signal === 6) {
                // `distance` дистанция относительно стрелочки ( отрицательное = вперёд | положительное = назад )
                // в данном случае `distance` равен -2 поэтому получается стрелочка через 2 клетки от этой
                let narrow = window.game.FAPI.SignalUpdater.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -2);
                window.game.FAPI.SignalUpdater.updateCount(narrow); // Добавляет стрелочке сигнал
            }
        } // `transmit` вызывается раньше чем `block`
        стрелочка.block = (arrow, chunk, x, y) => {
            if (arrow.signal === 6) {
                let narrow = window.game.FAPI.SignalUpdater.adv_getArrowAt(chunk, x, y, arrow.rotation, arrow.flipped, -1);
                window.game.FAPI.SignalUpdater.blockSignal(narrow); // Блокирует сигнал стрелочки
            }
        } // `block` вызывается позже всех
        стрелочка.press = (arrow, is_shift) => {
            // Вызывается при нажатии на стрелочку
            // `arrow` стрелочка на которую нажали
            // `is_shift` был ли нажат `Shift` на клавиатуре или нет
            arrow.signal = 6; // В данном случае при нажатии стрелочка получает фиолетовый сигнал
        }

        // `idname` - Должен быть обязательно на английском без пробелов и с маленьким регистром иначе мод не загрузится.
        // желательно писать `author.name` где `author` это ваш ник на английском и `name` это название мода на английском
        window.game.FAPI.registerMod('Название', 'author.name', 'Автор', 'API для мододелов', (mod) => {
            window.game.FAPI.registerArrows([стрелочка], mod);
            console.log('Мод загружен!');
        });
    });
})();