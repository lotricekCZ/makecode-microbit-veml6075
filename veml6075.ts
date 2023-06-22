/**
 * Gives an access to VEML6075 UVA/B sensor.
 */
//% color=#ecac05 weight=100 icon="\uf185" block="VEML6075 extension"
//% groups=['Setters', 'Getters', 'Control', 'others']
namespace veml6075 {
	const _veml_id: uint8 = 0x26;
	let addr: uint8 = (0x10); ///< I2C address (cannot be changed)
	let _read_delay: uint16 = 50;
	let _uva: number = 0;
	let _uvb: number = 0;


	/**
 	* Class to store settings
 	*/
	class command_register {
		public SD: boolean;			// Shut Down
		public UV_AF: boolean;		// Auto or forced
		public UV_TRIG: boolean;	// Trigger forced mode
		public UV_HD: boolean;		// High dynamic
		public UV_IT: uint8;		// Integration Time

		constructor() {
			this.SD = false;
			this.UV_AF = false;
			this.UV_TRIG = false;
			this.UV_HD = false;
			this.UV_IT = 0;
		}

		get_reg(): uint16 {
			let ret = ((this.SD ? 0b1 : 0) & 0b1) << 7 |
				((this.UV_AF ? 0b1 : 0) & 0b1) << 6 |
				((this.UV_TRIG ? 0b1 : 0) & 0b1) << 5 |
				((this.UV_HD ? 0b1 : 0) & 0b1) << 4 |
				(this.UV_IT & 0b111);

			return 0x0000 | ret;
		}
	}


	let comm_reg: command_register;


	enum register {
		conf = 		(0x00),	///< Configuration register
		uva = 		(0x07),	///< UVA band raw measurement
		dark = 		(0x08),	///< Dark current (?) measurement
		uvb = 		(0x09),	///< UVB band raw measurement
		uvcomp1 = 	(0x0A),	///< UV1 compensation value
		uvcomp2 = 	(0x0B),	///< UV2 compensation value
		id = 		(0x0C)	///< Manufacture ID
	}


	let default_coeficients = {
		///< These values are default for no coverglass
		uva_a_coeff: 2.22,
		uva_b_coeff: 1.33,
		uvb_c_coeff: 2.95,
		uvb_d_coeff: 1.74,
		uva_response: 0.001461,
		uvb_response: 0.002591
	};


	export enum integration_time {
		//% block="50 ms"
		t50ms = 0,
		//% block="100 ms"
		t100ms = 1,
		//% block="200 ms"
		t200ms = 2,
		//% block="400 ms"
		t400ms = 3,
		//% block="800 ms"
		t800ms = 4
	}


	export enum veml_fn_get_number {
		//% block="UVA"
		uva,
		//% block="UVB"
		uvb,
		//% block="UV Index"
		uvi,
		//% block="UVA coefficient A"
		uva_a_coeff,
		//% block="UVA coefficient B"
		uva_b_coeff,
		//% block="UVB coefficient C"
		uvb_c_coeff,
		//% block="UVB coefficient D"
		uvb_d_coeff,
		//% block="UVA response"
		uva_response,
		//% block="UVB response"
		uvb_response,
		//% block="integration time"
		integration_time
	}


	export enum veml_fn_get_bool {
		//% block="high dynamic"
		high_dynamic,
		//% block="forced mode"
		forced_mode
	}


	export enum veml_fn_on_event {
		//% block="exceeds"
		exceeds,
		//% block="drops below"
		drops_below,
		//% block="falls to"
		falls_to,
		//% block="="
		equals,
		//% block="rises to"
		rises_to
	}


	export enum veml_fn_set {
		//% block="UVA coefficient A"
		uva_a_coeff,
		//% block="UVA coefficient B"
		uva_b_coeff,
		//% block="UVB coefficient C"
		uvb_c_coeff,
		//% block="UVB coefficient D"
		uvb_d_coeff,
		//% block="UVA response"
		uva_response,
		//% block="UVB response"
		uvb_response,
		//% block="high dynamic"
		high_dynamic,
		//% block="forced"
		forced_mode,
		//% block="integration time"
		integration_time
	}
	


 /**
  * Initiates sensor and communication
  * @param {uint8} address i2c address
  * @param {integration_time} itime=integration_time.t100ms integration time (currently unused)
  * @param {boolean} high_dynamic=false
  * @param {boolean} forced_reads=false
  * @returns {boolean} whether the ID in the register matches expected ID or not
  */
	
	//% blockId=veml_init
	//% block="initialise sensor $address"
	//% block.loc.cs="iniciuj senzor $address"
	//% address.min=0 address.max=0x80 address.defl=0x10
	//% group="Control"
	export function begin(address = addr, itime: integration_time = integration_time.t100ms,
		high_dynamic: boolean = false, forced_reads: boolean = false): boolean {
		
		addr = address % 127;
		i2c_write([<uint8>register.id, 0]);
		let _ID = i2c_read();
		
		set_coefficients(default_coeficients.uva_a_coeff, default_coeficients.uva_b_coeff,
			default_coeficients.uvb_c_coeff, default_coeficients.uvb_d_coeff,
			default_coeficients.uva_response, default_coeficients.uvb_response);
			
		// TODO: Elegant solution
		set_integration_time(itime);
		set_forced_mode(forced_reads);
		set_high_dynamic(high_dynamic);
		
		return _ID === _veml_id;
	}


	
 /**
  * Normal sensor and communication initiation
  * @param {uint8} address i2c address
  * @returns {void}
  */
	
	//% blockId=veml_void_init
	//% block="initialise sensor $address"
	//% block.loc.cs="iniciuj senzor $address"
	//% address.min=0 address.max=0x80 address.defl=0x10
	//% group="Control"
	export function begin_void(address = addr): void {
		begin(address);
	}


 /**
  * Get any numerical value via unified interface
  * @param {veml_fn_get_number} variable variable we want to query
  * @returns {number} result we get
  */
	
	//% blockId=veml_get_number
	//% block="numeric value of %variable"
	//% block.loc.cs="číselná hodnota %variable"
	//% group="Getters"
	export function get_variable_number(variable: veml_fn_get_number): number {
		switch (variable) {
			case veml_fn_get_number.uva: {
				return readUVA();
			}
			case veml_fn_get_number.uvb: {
				return readUVA();
			}
			case veml_fn_get_number.uvi: {
				return readUVI();
			}
			case veml_fn_get_number.uva_a_coeff: {
				return default_coeficients.uva_a_coeff;
			}
			case veml_fn_get_number.uva_b_coeff: {
				return default_coeficients.uva_b_coeff;
			}
			case veml_fn_get_number.uvb_c_coeff: {
				return default_coeficients.uvb_c_coeff;
			}
			case veml_fn_get_number.uvb_d_coeff: {
				return default_coeficients.uvb_d_coeff;
			}
			case veml_fn_get_number.uva_response: {
				return <number> default_coeficients.uva_response;
			}
			case veml_fn_get_number.uvb_response: {
				return <number> default_coeficients.uvb_response;
			}
			case veml_fn_get_number.integration_time: {
				return _read_delay;
			}
		}
	}


 /**
  * Get any boolean value via unified interface
  * @param {veml_fn_get_bool} bool bool we want to query
  * @returns {boolean} result we get
  */
	
	//% blockId=veml_get_bool
	//% block="logical value of %bool"
	//% block.loc.cs="logická hodnota %bool"
	//% group="Getters"
	export function get_variable_bool(bool: veml_fn_get_bool): boolean {
		switch (bool) {
			case veml_fn_get_bool.high_dynamic: {
				return get_high_dynamic();
			}
			case veml_fn_get_bool.forced_mode: {
				return get_forced_mode();
			}
		}
	}


/**
 * Get any boolean value via unified interface. Uses C-style bool evaluation 
 * (anything not equal to 0 is deemed to be true) for functions with boolean parameters.
 * @param {veml_fn_set} variable variable we want to assign new value
 * @param {any} val the new value
 * @returns {void}
 */

	//% blockId=veml_set
	//% block="set %variable to $val"
	//% block.loc.cs="nastav %variable na $val"
	//% group="Setters"
	export function set(variable: veml_fn_set, val: number): void {
		switch (variable) {
			case veml_fn_set.uva_a_coeff: {
				set_coefficients(<number>val, default_coeficients.uva_b_coeff, default_coeficients.uvb_c_coeff,
					default_coeficients.uvb_d_coeff, default_coeficients.uva_response, default_coeficients.uvb_response);
				break;
			}
			case veml_fn_set.uva_b_coeff: {
				set_coefficients(default_coeficients.uva_a_coeff, <number>val, default_coeficients.uvb_c_coeff,
					default_coeficients.uvb_d_coeff, default_coeficients.uva_response, default_coeficients.uvb_response);
				break;
			}
			case veml_fn_set.uvb_c_coeff: {
				set_coefficients(default_coeficients.uva_a_coeff, default_coeficients.uva_b_coeff, <number>val,
					default_coeficients.uvb_d_coeff, default_coeficients.uva_response, default_coeficients.uvb_response);
				break;
			}
			case veml_fn_set.uvb_d_coeff: {
				set_coefficients(default_coeficients.uva_a_coeff, default_coeficients.uva_b_coeff, default_coeficients.uvb_c_coeff,
					<number>val, default_coeficients.uva_response, default_coeficients.uvb_response);
				break;
			}
			case veml_fn_set.uva_response: {
				set_coefficients(default_coeficients.uva_a_coeff, default_coeficients.uva_b_coeff, default_coeficients.uvb_c_coeff,
					default_coeficients.uvb_d_coeff, <number>val, default_coeficients.uvb_response);
				break;
			}
			case veml_fn_set.uvb_response: {
				set_coefficients(default_coeficients.uva_a_coeff, default_coeficients.uva_b_coeff, default_coeficients.uvb_c_coeff,
					default_coeficients.uvb_d_coeff, default_coeficients.uva_response, <number>val);
				break;
			}
			case veml_fn_set.high_dynamic: {
				set_high_dynamic(Math.abs(val) > 0);
				break;
			}
			case veml_fn_set.forced_mode: {
				set_forced_mode(Math.abs(val) > 0);
				break;
			}
			case veml_fn_set.integration_time: {
				set_integration_time_at_least(<uint16>val);
				break;
			}
		}
	}



 /**
  * Sets integration time
  * @param {integration_time} itime new integration time
  * @returns {void}
  */
	
	//% blockId=veml_it_set
	//% block="set integration_time to %itime"
	//% block.loc.cs="nastav čas integrace na %itime"
	//% group="Setters"
	export function set_integration_time(itime: integration_time): void {
		comm_reg.UV_IT = <uint8>itime;
		_read_delay = 25 * (2 << itime);
		set_config();
	}


 /**
  * Iterates the integration_time options and stops if the itime
  * is either matched or smaller than the integration_time
  * @param {number} itime
  * @returns {void}
  */
	
	//% blockId=veml_it_set_at_least
	//% block="set integration_time to at least $itime ms"
	//% block.loc.cs="nastav čas integrace aspoň na $itime ms"
	//% itime.min=0 itime.max=800 itime.dflv=100
	//% group="Setters"
	export function set_integration_time_at_least(itime: number = 100): void {
		_read_delay = 50;

		for (let i = 0; i < <uint8>integration_time.t800ms; i++) {
			if (_read_delay >= itime || i == <uint8>integration_time.t800ms) {
				comm_reg.UV_IT = i;
				break;
			}
			_read_delay *= 2;
		}
		set_config();
	}



	//% blockId=veml_it_get
	//% block="integration time"
	//% block.loc.cs="čas integrace"
	//% group="Getters"
	export function get_integration_time(): integration_time {
		return comm_reg.UV_IT;
	}

	//% blockId=veml_hd_set
	//% block="set high_dynamic to $hd"
	//% block.loc.cs="nastav high_dynamic na $hd"
	//% group="Setters"
	export function set_high_dynamic(hd: boolean = true): void {
		comm_reg.UV_HD = hd;
		set_config();
	}


	//% blockId=veml_hd_get
	//% block="high_dynamic"
	//% block.loc.cs="high_dynamic"
	//% group="Getters"
	export function get_high_dynamic(): boolean {
		return comm_reg.UV_HD;
	}


	//% blockId=veml_fm_set
	//% block="set force mode to $flag"
	//% block.loc.cs="nastav force mód na $flag"
	//% group="Setters"
	function set_forced_mode(flag: boolean = true): void {
		comm_reg.UV_TRIG = flag;
		set_config();
	}


	//% blockId=veml_fm_get
	//% block="forced mode"
	//% block.loc.cs="force mód"
	//% group="Getters"
	function get_forced_mode(): boolean {
		return comm_reg.UV_TRIG;
	}


 /**
  * Sends the current register config to the sensor
  * @returns {void}
  */
	
	function set_config(): void {
		let reg = comm_reg.get_reg();
		i2c_write([<uint8>(reg >> 8), <uint8>(reg & 255)]);
	}


 /**
  * Assigns the given coefficients globally
  * @param {number} UVA_A coefficient assigned
  * @param {number} UVA_B coefficient assigned
  * @param {number} UVB_C coefficient assigned
  * @param {number} UVB_D coefficient assigned
  * @param {number} UVA_response coefficient assigned
  * @param {number} UVB_response coefficient assigned
  * @returns {void}
  */
	
	//% blockId=veml_cf_set
	//% block="set coefficients|UVA A to $UVA_A|UVA B to $UVA_B|UVB C to $UVB_C|UVB D to $UVB_D|response UVA to $UVA_response|response UVB to $UVB_response"
	//% group="Setters"
	export function set_coefficients(UVA_A: number, UVA_B: number, UVB_C: number, UVB_D: number,
		UVA_response: number, UVB_response: number): void {
		default_coeficients.uva_a_coeff = <number>UVA_A;
		default_coeficients.uva_b_coeff = <number>UVA_B;
		default_coeficients.uvb_c_coeff = <number>UVB_C;
		default_coeficients.uvb_d_coeff = <number>UVB_D;
		default_coeficients.uva_response = <number>UVA_response;
		default_coeficients.uvb_response = <number>UVB_response;
	}


	//% blockId=veml_get_UVA
	//% block="UVA"
	//% group="Getters"
	export function readUVA(): number {
		take_reading();
		return _uva;
	}


	//% blockId=veml_get_UVB
	//% block="UVB"
	//% group="Getters"
	export function readUVB(): number {
		take_reading();
		return _uvb;
	}


	//% blockId=veml_get_index
	//% block="UV index"
	//% group="Getters"
	export function readUVI(): number {
		take_reading();
		return ((_uva * default_coeficients.uva_response) + (_uvb * default_coeficients.uvb_response)) / 2;
	}


	//% blockId=veml_get_all
	//% block="all UV data"
	//% block.loc.cs="všechny UV data"
	//% group="Getters"
	export function readUVABI(): number[] {
		take_reading();
		return [_uva, _uvb, ((_uva * default_coeficients.uva_response) + (_uvb * default_coeficients.uvb_response)) / 2];
	}

	
 /**
  * A simple interface to activate certain interrupt-like procedure when something occurs
  * @param {veml_fn_get_number} variable variable we want to query
  * @param {veml_fn_on_event} condition comparator
  * @param {number} value value we check against
  * @param {function} handler function activated when the given condition was valid
  * @returns {void}
  */
	
	//% blockId=veml_on_event
	//% block="if %variable %quantificator $value"
	export function on_event(variable: veml_fn_get_number, condition: veml_fn_on_event, value: number, handler: () => void) {
		// Quite frankly not sure whether this thing is needed.
		control.onEvent(_veml_id, variable, handler); // perhaps incomplete and might gonna need to be separate for other cases.
		control.runInBackground(() => {
			while(true) {
				let resolution = get_variable_number(variable);
				let is_met = false;
				switch (condition) {
					case veml_fn_on_event.exceeds:
						is_met = (resolution > value);
						break;
					case veml_fn_on_event.drops_below:
						is_met = (resolution < value);
						break;
					case veml_fn_on_event.falls_to:
						is_met = (resolution <= value);
						break;
					case veml_fn_on_event.equals:
						is_met = (resolution == value);
						break;
					case veml_fn_on_event.rises_to:
						is_met = (resolution >= value);
						break;
				}
				if (is_met) {
					control.raiseEvent(_veml_id, resolution);
				}
				basic.pause(200);
			}
		})
	}


/**
 * Function we call every time to gain current UV light info
 * @returns {void}
 */

	function take_reading(): void {
		i2c_write([<uint8>register.uva, 0]);
		let _uva_raw = i2c_read();

		i2c_write([<uint8>register.uvb, 0]);
		let _uvb_raw = i2c_read();

		i2c_write([<uint8>register.uvcomp1, 0]);
		let _uvcomp1 = i2c_read();

		i2c_write([<uint8>register.uvcomp2, 0]);
		let _uvcomp2 = i2c_read();

		_uva = _uva_raw - (default_coeficients.uva_a_coeff * _uvcomp1) - (default_coeficients.uva_b_coeff * _uvcomp2);
		_uvb = _uvb_raw - (default_coeficients.uvb_c_coeff * _uvcomp1) - (default_coeficients.uvb_d_coeff * _uvcomp2);
	}



	function i2c_write(data: uint8[]) {
		pins.i2cWriteBuffer(addr, pins.createBufferFromArray(data));
	}



	function i2c_read(): uint16 {
		return pins.i2cReadBuffer(addr, 2).toArray(NumberFormat.Int16LE)[0];
	}

}