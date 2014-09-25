define([
	"cldr",
	"make-plural",
	"./core",
	"./common/validate/cldr",
	"./common/validate/default-locale",
	"./common/validate/parameter-key-presence",
	"./common/validate/parameter-presence",
	"./common/validate/parameter-type",
	"./common/validate/parameter-type/number",
	"./common/validate/parameter-type/plain-object",
	"./common/format-message",
	"cldr/supplemental"
], function( Cldr, MakePlural, Globalize, validateCldr, validateDefaultLocale,
	validateParameterKeyPresence, validateParameterPresence, validateParameterType,
	validateParameterTypeNumber, validateParameterTypePlainObject, formatMessage ) {

/**
 * ._formatPlural( value, data, formatValue )
 *
 * @value [Number]
 *
 * @messageData [JSON] eg. { one: "{0} second", other: "{0} seconds" }
 *
 * @formatValue [String|Number] It defaults to `value`. It's used to replace the
 * {0} variable of plural messages.
 *
 * Return the appropriate message based on value's plural group: zero | one |
 * two | few | many | other.
 */
Globalize._formatPlural =
Globalize.prototype._formatPlural = function( value, messageData, formatValue ) {
	var form;

	// Note: validateParameterTypeNumber( value, "value" ) is deferred to this.plural().
	validateParameterPresence( value, "value" );
	validateParameterPresence( messageData, "messageData" );
	validateParameterTypePlainObject( messageData, "messageData" );

	validateParameterType(
		formatValue,
		"formatValue",
		formatValue === undefined || typeof formatValue === "string" ||
			typeof formatValue === "number",
		"String or Number"
	);

	form = this.plural( value );

	// formatValue defaults to value, but it accepts anything including empty strings.
	formatValue = formatValue === undefined ? value : formatValue;

	validateParameterKeyPresence( messageData, "messageData", form );

	return formatMessage( messageData[ form ], [ formatValue ] );
};

/**
 * .plural( value )
 *
 * @value [Number]
 *
 * Return the corresponding form (zero | one | two | few | many | other) of a
 * value given locale.
 */
Globalize.plural =
Globalize.prototype.plural = function( value ) {
	validateParameterPresence( value, "value" );
	validateParameterTypeNumber( value, "value" );
	return this.pluralGenerator()( value );
};

/**
 * .pluralGenerator()
 *
 * Return a plural function (of the form below).
 *
 * fn( value )
 *
 * @value [Number]
 *
 * Return the corresponding form (zero | one | two | few | many | other) of a value given the
 * default/instance locale.
 */
Globalize.pluralGenerator =
Globalize.prototype.pluralGenerator = function() {
	var cldr, plural;

	cldr = this.cldr;

	validateDefaultLocale( cldr );

	cldr.on( "get", validateCldr );
	cldr.supplemental( "plurals-type-cardinal/{language}" );
	cldr.off( "get", validateCldr );

	// Set CLDR data
	MakePlural.rules = {
		cardinal: cldr.supplemental( "plurals-type-cardinal" )
	};

	plural = MakePlural( cldr.attributes.language, { "no_tests": true } );

	return function( value ) {
		validateParameterPresence( value, "value" );
		validateParameterTypeNumber( value, "value" );

		return plural( value );
	};
};

return Globalize;

});
