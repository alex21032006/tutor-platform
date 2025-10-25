# imghdr_fix.py
import sys
from PIL import Image

class ImghdrShim:
    @staticmethod
    def what(file, h=None):
        try:
            with Image.open(file) as img:
                return img.format.lower()
        except:
            return None

# Подменяем отсутствующий модуль
sys.modules['imghdr'] = ImghdrShim