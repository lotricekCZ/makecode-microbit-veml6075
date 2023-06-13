namespace veml6075 {

	let addr: uint8 = (0x10); ///< I2C address (cannot be changed)
	let _read_delay: uint16 = 50;
	let _uva: number = 0;
	let _uvb: number = 0;
	
	class command_register {
		public SD:		boolean;	// Shut Down
		public UV_AF:	boolean;	// Auto or forced
		public UV_TRIG:	boolean;	// Trigger forced mode
		public UV_HD:	boolean;	// High dynamic
		public UV_IT:	uint8;		// Integration Time
		
	  
		reg: uint16; // The raw 16 bit register data
	  
		constructor() {
			this.SD = 			false;
			this.UV_AF = 		false;
			this.UV_TRIG = 		false;
			this.UV_HD = 		false;
			this.UV_IT = 		0;
		}
		
		get_reg(): uint16 {
			let ret: uint8 = 	(<uint8>(<unknown>this.SD) & 1) 		<< 7 |
								(<uint8>(<unknown>this.UV_AF) & 1) 		<< 6 |
								(<uint8>(<unknown>this.UV_TRIG) & 1) 	<< 5 |
								(<uint8>(<unknown>this.UV_HD) & 1) 		<< 4 |
								(this.UV_IT & 0b111);
								
			return 0x0000 | ret;
		}
	}


	let cr: command_register;

	
	enum register {
		conf	= (0x00),	///< Configuration register
		uva		= (0x07),	///< UVA band raw measurement
		dark	= (0x08),	///< Dark current (?) measurement
		uvb		= (0x09),	///< UVB band raw measurement
		uvcomp1	= (0x0A),	///< UV1 compensation value
		uvcomp2	= (0x0B),	///< UV2 compensation value
		id		= (0x0C)	///< Manufacture ID
	}
	

	enum default_coeficients {
		///< These values are default for no coverglass
		uva_a_coeff		= 2.22,	
		uva_b_coeff		= 1.33,
		uvb_c_coeff		= 2.95,
		uvb_d_coeff		= 1.74,
		uva_response	= 0.001461,
		uvb_response	= 0.002591
	}
	

	enum integration_time {
		t50ms,
		t100ms,
		t200ms,
		t400ms,
		t800ms
	}
	

	let _uva_response: number = default_coeficients.uva_response;
	let _uvb_response: number = default_coeficients.uvb_response;
	
	let _uva_a: number = default_coeficients.uva_a_coeff;
	let _uva_b: number = default_coeficients.uva_b_coeff;
	let _uvb_c: number = default_coeficients.uvb_c_coeff;
	let _uvb_d: number = default_coeficients.uvb_d_coeff;


	function begin(itime: integration_time = integration_time.t100ms,
		highDynamic: boolean = false, forcedReads: boolean = false): boolean {
		
		// Nastavení konfigurace
		i2cWrite([<uint8>register.uva, 0]);
		let _ID: uint16 = i2cRead();

		setCoefficients(default_coeficients.uva_a_coeff, default_coeficients.uva_b_coeff,
			default_coeficients.uvb_c_coeff, default_coeficients.uvb_d_coeff,
			default_coeficients.uva_response, default_coeficients.uvb_response);
			
		pins.i2cWriteNumber(0x00, 0x00, NumberFormat.UInt8LE);  // Zápis hodnoty 0x00 na adresu 0x00
		
		cr.reg = 0;
		// Čekání na inicializaci
		return true;
	}



	function setIntegrationTime(itime: integration_time): void {
		cr.UV_IT = <uint8>itime;
		_read_delay = 25 * (2 << itime);
	}


	function getIntegrationTime(): integration_time {
		return integration_time.t100ms;
	}


	function setHighDynamic(hd: boolean): void {

	}


	function getHighDynamic(): boolean {

	}


	function setForcedMode(flag: boolean): void {

	}


	function getForcedMode(): boolean {

	}


	function setCoefficients(UVA_A: number, UVA_B: number, UVB_C: number, UVB_D: number,
							UVA_response: number, UVB_response: number): void {
		_uva_a = 		UVA_A;
		_uva_b = 		UVA_B;
		_uvb_c = 		UVB_C;
		_uvb_d = 		UVB_D;
		_uva_response = UVA_response;
		_uvb_response = UVB_response;
	}


	function readUVA(): number {
		take_reading();
		return _uva;
	}


	function readUVB(): number {
		take_reading();
		return _uvb;
	}


	function readUVI(): number {
		take_reading();
		
		return ((_uva * _uva_response) + (_uvb * _uvb_response)) / 2;
	}


	function read_UVABI(a: number, b: number, i: number): number[] {
		take_reading();
		return [_uva, _uvb, ((_uva * _uva_response) + (_uvb * _uvb_response)) / 2];
	}


	function take_reading(): void {
		i2cWrite([<uint8>register.uva, 0]);
		let _uva_raw: uint16 = i2cRead();

		i2cWrite([<uint8>register.uvb, 0]);
		let _uvb_raw: uint16 = i2cRead();

		i2cWrite([<uint8>register.uvcomp1, 0]);
		let _uvcomp1: uint16 = i2cRead();

		i2cWrite([<uint8>register.uvcomp2, 0]);
		let _uvcomp2: uint16 = i2cRead();

		_uva = _uva_raw - (_uva_a * _uvcomp1) - (_uva_b * _uvcomp2);
  		_uvb = _uvb_raw - (_uvb_c * _uvcomp1) - (_uvb_d * _uvcomp2);
	}


	// Odeslání zprávy na I2C sběrnici
	function i2cWrite(data: uint8[]) {
		pins.i2cWriteBuffer(addr, pins.createBufferFromArray(data));
	}


	// Přečtení odpovědi ze senzoru přes I2C sběrnici
	function i2cRead(): uint16 {
		return pins.i2cReadBuffer(addr, 2).toArray(NumberFormat.Int16LE)[0];
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
	init();

	// Kód, ve kterém můžete použít získané hodnoty
	basic.forever(function () {
		// Získání a zobrazení hodnoty UV indexu
		const uvIndex = getUVIndex();
		basic.showNumber(uvIndex);

		basic.pause(1000);
	});

}