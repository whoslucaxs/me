# ESP32-S3 ASCII turntable

Model: https://github.com/shkuznetsov/YD-ESP32-S3/blob/main/YD-ESP32-S3.step

YD-ESP32-S3 model by David Scambell, collected and published by Alexander Kuznetsov under MIT (see LICENSE-model.txt).

Download that STEP as `board.step` beside render.py, then run `python tools/esp32/render.py` from the project root. The script tessellates the actual CAD geometry and renders a 360 degree rotation into ASCII characters, exporting an animated GIF and a still frame for reduced motion. Python dependencies are build tools only; the website only serves the resulting images.
