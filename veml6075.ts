namespace veml6075 {

	var addr: number = (0x10); ///< I2C address (cannot be changed)

	enum register {
		CONF	= (0x00),	///< Configuration register
		UVA		= (0x07),	///< UVA band raw measurement
		DARK	= (0x08),	///< Dark current (?) measurement
		UVB		= (0x09),	///< UVB band raw measurement
		UVCOMP1	= (0x0A),	///< UV1 compensation value
		UVCOMP2	= (0x0B),	///< UV2 compensation value
		ID		= (0x0C)	///< Manufacture ID
	}

	enum default_coeficients {
		uva_a_coeff		= 2.22,		///< Default for no coverglass
		uva_b_coeff		= 1.33,		///< Default for no coverglass
		uva_c_coeff		= 2.95,		///< Default for no coverglass
		uva_d_coeff		= 1.74,		///< Default for no coverglass
		uva_response	= 0.001461,	///< Default for no coverglass
		uvb_response	= 0.002591	///< Default for no coverglass
	}
	
	/**************************************************************************/
	/*!
		@brief  integration time definitions
	*/
	/**************************************************************************/
	enum integration_time {
	  t50ms,
	  t100ms,
	  t200ms,
	  t400ms,
	  t800ms
	}
	

// Odeslání zprávy na I2C sběrnici
function i2cWrite(data: number[]) {
	pins.i2cWriteBuffer(addr, pins.createBufferFromArray(data));
}

// Přečtení odpovědi ze senzoru přes I2C sběrnici
function i2cRead(): number[] {
	return pins.i2cReadBuffer(addr, 2).toArray();
}

// Inicializace VEML6075
function initVEML6075() {
	// Nastavení konfigurace
	i2cWrite([0x02, 0x11]); // Automatický režim, UV measurement enable

	// Čekání na inicializaci
	basic.pause(100);
}

// Získání hodnoty UV indexu z VEML6075
function getUVIndex(): number {
	// Zaslání příkazu pro čtení hodnoty
	i2cWrite([0x03]);

	// Přečtení odpovědi
	const data = i2cRead();
	const uvIndex = (data[0] << 8) | data[1];

	return uvIndex;
}

// Inicializace VEML6075 při spuštění
initVEML6075();

// Kód, ve kterém můžete použít získané hodnoty
basic.forever(function () {
	// Získání a zobrazení hodnoty UV indexu
	const uvIndex = getUVIndex();
	basic.showNumber(uvIndex);

	basic.pause(1000);
});

}