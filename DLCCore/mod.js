// Defines
const SYMBOLS = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюяАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!?\"\`\'#()[].,_- \n'.split('');
const FAPI = window.fapi;
const ModalHandler = FAPI.imodules.ModalHandler;
const ChunkUpdates = FAPI.routes.ChunkUpdates;

const mod = FAPI.registerMod('fotis.dlc_core');

// region RGB_LAMP
const rgb_lamp = mod.registerArrow(0)
rgb_lamp.name = ['RGB lamp','Разноцветная лампочка','Різнобарвна лампочка','Рознакаляровая лямпа'];
rgb_lamp.activation = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
rgb_lamp.action = ["Does nothing.","Ничего не делает.","Нічого не робить.","Нічога не рабіць."];
rgb_lamp.icon_url = "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/rgb_lamp.png";
rgb_lamp.clickable = true;
rgb_lamp.update = (arrow) => {
    let [color, activation, transmit] = arrow.custom_data;

    if (color === 0) arrow.signal = arrow.signalsCount;
    else if (activation === 0 && arrow.signalsCount > 0) arrow.signal = color;
    else if (activation === 1) arrow.signal = color;
    else if (activation === 2 && arrow.signalsCount === 0) arrow.signal = color;
    else arrow.signal = 0;
}
rgb_lamp.transmit = (arrow) => {
    let [color, activation, transmit] = arrow.custom_data;
    if (arrow.signal !== 0 && transmit === 1) ChunkUpdates.updateCount(arrow, ChunkUpdates.getArrowAt(arrow.chunk, arrow.x, arrow.y, arrow.rotation, arrow.flipped, -1, 0));
}
rgb_lamp.click = (arrow) => {
    const COLORS = ['Радужный ( от кол-ва сигналов )', 'Красный', 'Синий', 'Жёлтый', 'Зелёный', 'Оранжевый', 'Фиолетовый', 'Чёрный'];
    const ACTIVATION = ['При сигнале', 'Всегда ( можно блокировать )', 'При отсутствии сигнала'];
    const TRANSMIT = ['Нет', 'Следующей стрелочке'];

    const modal = ModalHandler.showModal();
    const colorSelect = modal.createSelect('Цвет', COLORS)
    colorSelect.value = COLORS[arrow.custom_data[0]];
    colorSelect.onchange = () => arrow.custom_data[0] = COLORS.indexOf(colorSelect.value);

    const activationSelect = modal.createSelect('Активация', ACTIVATION)
    activationSelect.value = ACTIVATION[arrow.custom_data[1]];
    activationSelect.onchange = () => arrow.custom_data[1] = ACTIVATION.indexOf(activationSelect.value);

    const transmitSelect = modal.createSelect('Передача', TRANSMIT)
    transmitSelect.value = TRANSMIT[arrow.custom_data[2]];
    transmitSelect.onchange = () => arrow.custom_data[2] = TRANSMIT.indexOf(transmitSelect.value);
}
rgb_lamp.load_cd = (cd) => {
    let transmit = cd[0] & 1;
    let activation = (cd[1] >> 3) & 0b11;
    let color = (cd[2] >> 5) & 0b111;
    return [color, activation, transmit];
}
rgb_lamp.save_cd = (arrow) => {
    return [(arrow.custom_data[0] << 5) | (arrow.custom_data[1] << 3) | arrow.custom_data[2]];
}
rgb_lamp.custom_data = [4, 0, 0];
// endregion
// region PURPLE_ARROW
const purple_arrow = mod.registerArrow(1)
purple_arrow.name = ['Purple arrow','Фиолетовая стрелка','Фіолетова стрілка','Фіялетавая стрэлка'];
purple_arrow.activation = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
purple_arrow.action = ["Sends a signal forwards, skipping `n` cells.","Передает сигнал вперед через `n` клеток.","Передає сигнал вперед через `n` клітини.","Перадае сігнал наперад праз `n` клеткі."];
purple_arrow.icon_url = "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/purple_arrow.png";
purple_arrow.textures = ["https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/purple_arrow.png", "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/purple_diagonal_arrow.png"];
purple_arrow.clickable = true;
purple_arrow.update = (arrow) => {
    if (arrow.signalsCount > 0) arrow.signal = 6;
    else arrow.signal = 0;
}
purple_arrow.transmit = (arrow) => {
    if (arrow.signal === 6) ChunkUpdates.updateCount(arrow, ChunkUpdates.getArrowAt(arrow.chunk, arrow.x, arrow.y, arrow.rotation, arrow.flipped, -arrow.custom_data[0], arrow.custom_data[1]));
}
purple_arrow.click = (arrow) => {
    const modal = ModalHandler.showModal();
    const xSelect = modal.createInput('Вперёд', 'От 0 до 15')
    xSelect.value = arrow.custom_data[0];
    xSelect.onchange = () => arrow.custom_data[0] = Math.max(0, Math.min(15, xSelect.value));

    const ySelect = modal.createInput('Вбок', 'От 0 до 15')
    ySelect.value = arrow.custom_data[1];
    ySelect.onchange = () => arrow.custom_data[1] = Math.max(0, Math.min(15, ySelect.value));
}
purple_arrow.draw = (arrow, index) => {
    if (arrow.custom_data !== undefined && arrow.custom_data[1] !== 0) return index + 1;
    return index;
}
purple_arrow.load_cd = (cd) => {
    let x = (cd[0] >> 4) & 0b1111;
    let y = cd[0] & 0b1111;
    return [x, y];
}
purple_arrow.save_cd = (arrow) => {
    return [(arrow.custom_data[0] << 4) | arrow.custom_data[1]];
}
purple_arrow.custom_data = [2, 0];
// endregion
// region TEXT_BLOCK
function text2seq(text) {
    let seq = [];
    text.split('').forEach((symbol) => {
        let index = SYMBOLS.indexOf(symbol);
        if (index !== -1) seq.push(index);
    });
    return seq;
}
function seq2text(seq) {
    let text = '';
    seq.forEach((val) => text += SYMBOLS[val]);
    return text;
}

const text_block = mod.registerArrow(2)
text_block.name =['Block of text','Блок текста','Блок текста','Блок текста'];
text_block.activation = ["On any incoming signal.","Любым входящим сигналом.","Будь-яким вхідним сигналом.","Любым уваходным сігналам."];
text_block.action =["Does nothing.","Ничего не делает.","Нічого не робить.","Нічога не рабіць."];
text_block.icon_url = "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/text_block.png";
text_block.clickable = true;
text_block.click = (arrow) => {
    const modal = ModalHandler.showModal();
    const textArea = modal.createTextArea('Текст', 'Введите текст')
    textArea.value = seq2text(arrow.custom_data);
    textArea.onchange = () => arrow.custom_data = text2seq(textArea.value);
}
// endregion
// region BUTTON
const button = mod.registerArrow(3)
button.name =['Button','Кнопка','Кнопка','Кнопка'];
button.activation = ["On press.","Зажимается на ПКМ.","Зажимается на ПКМ.","Зажимается на ПКМ."];
button.action =["Sends a signal around arrow.","Передает сигнал в близлежащие стрелочки.","Передает сигнал в близлежащие стрелочки.","Передает сигнал в близлежащие стрелочки."];
button.icon_url = "https://raw.githubusercontent.com/Fotiska/X-DLC/main/images/button.png";
button.pressable = true;
button.update = (arrow) => {
    arrow.signal = arrow.pressed || arrow.signalsCount > 0 ? 5 : 0;
    arrow.pressed = false;
}
button.transmit = (arrow) => {
    if (!arrow.pressed && arrow.signalsCount === 0) return;
    ChunkUpdates.updateCount(arrow, ChunkUpdates.getArrowAt(arrow.chunk, arrow.x, arrow.y, arrow.rotation, arrow.flipped, -1, 0));
    ChunkUpdates.updateCount(arrow, ChunkUpdates.getArrowAt(arrow.chunk, arrow.x, arrow.y, arrow.rotation, arrow.flipped, 1, 0));
    ChunkUpdates.updateCount(arrow, ChunkUpdates.getArrowAt(arrow.chunk, arrow.x, arrow.y, arrow.rotation, arrow.flipped, 0, -1));
    ChunkUpdates.updateCount(arrow, ChunkUpdates.getArrowAt(arrow.chunk, arrow.x, arrow.y, arrow.rotation, arrow.flipped, 0, 1));
}
button.press = (arrow, is_shift) => {
    if (is_shift) arrow.pressed = true;
}
// endregion

// TODO: Рандомайзер с настраиваемым рандомом
// TODO: Провод который позволит передавать биты
// TODO: АЛУ который принимает сигнал из 2-ух проводов
// TODO: Ячейка памяти которая будет хранить биты
// TODO: Кодер который будет передавать сигналы на провод
// TODO: Декодер который будет получать сигналы с провода