# Microbit Makecode VEML6075 UVA/B light sensor extension
This extension lets user work with Blocks language used mainly for educational purposes
## Usage
First, use `begin_void()` or representing block to initiate sensor, Though it seems to be completely unnecessary.
Then a wide range from `set_coefficients()` to `readUVI()` can be used. For simplicity, it may be fully replaced with `get()` and `set()` functions in the future.
## Known issues
Currently, although states like `force_mode` can be toggled, they don't modify the program flow. Extension has not been tested on any hardware.
## Contribute
Your path for contributions and suggestions begins [here](https://github.com/lotricekCZ/makecode-microbit-veml6075/issues).