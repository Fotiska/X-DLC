import base64
from enum import Enum
from typing import Union


class ROTATION(Enum):
    UP = 0
    RIGHT = 1
    DOWN = 2
    LEFT = 3


class TYPE(Enum):
    EMPTY = 0
    ARROW = 1
    SOURCE = 2
    BLOCKER = 3
    DELAY_ARROW = 4
    ...


def place(type: Union[TYPE, int], pos: int, rotation: Union[ROTATION, int]) -> str:
    if isinstance(type, TYPE):
        type = type.value
    if isinstance(rotation, ROTATION):
        rotation = rotation.value

    output = f" {type} 0 {pos} {rotation} "
    return output


print(place(TYPE.ARROW, 13, ROTATION.RIGHT)) # Выводит `1 0 13 1`
print(place(1, 13, 1)) # Выводит `1 0 13 1`
bschematic = ''

bschematic += '00000000' + '00000000' # 2 байта - версия
bschematic += '00000001' + '00000000' # 2 байта - кол-во чанков

bschematic += '00000000' + '00000000' # 2 байта - позиция чанка x
bschematic += '00000000' + '00000000' # 2 байта - позиция чанка y
bschematic += '00000000' # 1 байт - кол-во используемых типов стрелочек в чанке - 1 ( от 0, 0 = 1 используемый тип )

bschematic += '00000001' # 1 байт - тип стрелочки
bschematic += '00000001' # 1 байт - кол-во стрелочек данного типа в чанке ( от 0, 0 = 1 )

bschematic += '00000000' # 1 байт - ( 4 бита позиция x | 4 бита позиция y )
bschematic += '00000000' # 1 байт - ( 2 бита на поворот | 1 бит на зеркальность | оставшиеся пустые )

bschematic += '00010001' # 1 байт - ( 4 бита позиция x | 4 бита позиция y )
bschematic += '00000000' # 1 байт - ( 2 бита на поворот | 1 бит на зеркальность | оставшиеся пустые )

schematic = bytes([int(bschematic[i:i + 8], 2) for i in range(0, len(bschematic), 8)])
print(base64.b64encode(schematic).decode('utf-8'))