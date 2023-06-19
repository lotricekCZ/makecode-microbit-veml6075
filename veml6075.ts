/**
 * Gives an access to VEML6075 UVA/B sensor.
 */
//% color=190 weight=100 icon="\uf185" block="VEML6075 extension"
//% groups=['Setters', 'Getters', 'Sensor configuration', 'others']
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
	

	export enum integration_time {
		//% block="50 ms"
		t50ms,
		//% block="100 ms"
		t100ms,
		//% block="200 ms"
		t200ms,
		//% block="400 ms"
		t400ms,
		//% block="800 ms"
		t800ms
	}

	

	export let _uva_response: number = default_coeficients.uva_response;
	let _uvb_response: number = default_coeficients.uvb_response;
	
	let _uva_a: number = default_coeficients.uva_a_coeff;
	let _uva_b: number = default_coeficients.uva_b_coeff;
	let _uvb_c: number = default_coeficients.uvb_c_coeff;
	let _uvb_d: number = default_coeficients.uvb_d_coeff;

	//% blockId=veml_init
	//% block="initialise sensor $address"
	//% block.loc.cs="iniciuj senzor $address"
	//% address.min=0 address.max=0x80 address.defl=0x10
	export function begin(address: int8 = addr, itime: integration_time = integration_time.t100ms,
		highDynamic: boolean = false, forcedReads: boolean = false): boolean {
		addr = address;
		// Nastavení konfigurace
		i2c_write([<uint8>register.id, 0]);
		let _ID: uint16 = i2c_read()																																															;

		set_coefficients(default_coeficients.uva_a_coeff, default_coeficients.uva_b_coeff,
			default_coeficients.uvb_c_coeff, default_coeficients.uvb_d_coeff,
			default_coeficients.uva_response, default_coeficients.uvb_response);
			
		pins.i2cWriteNumber(0x00, 0x00, NumberFormat.UInt8LE);  // Zápis hodnoty 0x00 na adresu 0x00
		
		cr.reg = 0;
		// Čekání na inicializaci
		return true;
	}


	//% blockId=veml_void_init
	//% block="initialise sensor $address"
	//% block.loc.cs="iniciuj senzor $address"
	//% address.min=0 address.max=0x80 address.defl=0x10
	export function begin_void(address: int8 = addr): void {
		begin(address);
	}


	//% blockId=veml_it_set
	//% block="set integration_time to %itime"
	//% block.loc.cs="nastav čas integrace na %itime"
	export function set_integration_time(itime: integration_time): void {
		cr.UV_IT = <uint8>itime;
		_read_delay = 25 * (2 << itime);
		set_config();
	}

	//% blockId=veml_it_get
	//% block="integration time"
	//% block.loc.cs="čas integrace"
	export function get_integration_time(): integration_time {
		return cr.UV_IT;
	}

	//% blockId=veml_it_set
	//% block="set integration_time at least to $itime"
	//% block.loc.cs="nastav čas integrace aspoň na $itime"
	//% itime.min=0 itime.max=800 itime.dflv=100
	export function set_integration_time_at_least(itime: integration_time): void {
		cr.UV_IT = <uint8>itime;
		_read_delay = 25 * (2 << itime);
		set_config();
	}

	//% blockId=veml_hd_set
	//% block="set high_dynamic to $hd"
	//% block.loc.cs="nastav high_dynamic na $hd"
	export function setHighDynamic(hd: boolean = true): void {
		cr.UV_HD = hd;
		set_config();
	}

	//% blockId=veml_hd_get
	//% block="high_dynamic"
	//% block.loc.cs="high_dynamic"
	export function getHighDynamic(): boolean {
		return cr.UV_HD;
	}

	//% blockId=veml_fm_set
	//% block="set force mode to $flag"
	//% block.loc.cs="nastav force mód na $flag"
	function set_forced_mode(flag: boolean = true): void {
		cr.UV_TRIG = flag;
		set_config();
	}
	
	//% blockId=veml_fm_get
	//% block="forced mode"
	//% block.loc.cs="force mód"
	function get_forced_mode(): boolean {
		return cr.UV_TRIG;
	}

	function set_config(): void {
		let reg: uint16 = cr.get_reg();
		i2c_write([<uint8>(reg >> 8), <uint8>(reg & 255)]);
	}



	export function set_coefficients(UVA_A: number, UVA_B: number, UVB_C: number, UVB_D: number,
							UVA_response: number, UVB_response: number): void {
		_uva_a = 		UVA_A;
		_uva_b = 		UVA_B;
		_uvb_c = 		UVB_C;
		_uvb_d = 		UVB_D;
		_uva_response = UVA_response;
		_uvb_response = UVB_response;
	}

	//% blockId=veml_get_UVA
	//% block="UVA"
	export function readUVA(): number {
		take_reading();
		return _uva;
	}

	//% blockId=veml_get_UVB
	//% block="UVB"
	export function readUVB(): number {
		take_reading();
		return _uvb;
	}

	//% blockId=veml_get_index
	//% block="UV index"
	export function readUVI(): number {
		take_reading();
		return ((_uva * _uva_response) + (_uvb * _uvb_response)) / 2;
	}

	//% blockId=veml_get_all
	//% block="all UV data"
	//% block.loc.cs="všechny UV data"
	export function read_UVABI(): number[] {
		take_reading();
		return [_uva, _uvb, ((_uva * _uva_response) + (_uvb * _uvb_response)) / 2];
	}


	function take_reading(): void {
		i2c_write([<uint8>register.uva, 0]);
		let _uva_raw: uint16 = i2c_read();

		i2c_write([<uint8>register.uvb, 0]);
		let _uvb_raw: uint16 = i2c_read();

		i2c_write([<uint8>register.uvcomp1, 0]);
		let _uvcomp1: uint16 = i2c_read();

		i2c_write([<uint8>register.uvcomp2, 0]);
		let _uvcomp2: uint16 = i2c_read();

		_uva = _uva_raw - (_uva_a * _uvcomp1) - (_uva_b * _uvcomp2);
  		_uvb = _uvb_raw - (_uvb_c * _uvcomp1) - (_uvb_d * _uvcomp2);
	}


	// Odeslání zprávy na I2C sběrnici
	function i2c_write(data: uint8[]) {
		pins.i2cWriteBuffer(addr, pins.createBufferFromArray(data));
	}


	// Přečtení odpovědi ze senzoru přes I2C sběrnici
	function i2c_read(): uint16 {
		return pins.i2cReadBuffer(addr, 2).toArray(NumberFormat.Int16LE)[0];
	}

}