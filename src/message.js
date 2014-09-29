define([
	"cldr",
	"messageformat",
	"./core",
	"./common/create-error",
	"./common/validate/default-locale",
	"./common/validate/parameter-presence",
	"./common/validate/parameter-type",
	"./common/validate/parameter-type/plain-object",
	"./util/always-array"
], function( Cldr, createError, MessageFormat, Globalize, validateDefaultLocale,
	validateParameterPresence, validateParameterType, validateParameterTypePlainObject,
	alwaysArray ) {

function throwLoadPluralError() {
	createError( "E_NEEDS_PLURAL_MOD", "Load Globalize plural module" );
}

function pluralFn( cldr ) {
	// FIXME: depends on the yet-to-be-created plural generator:
	// pluralFormatter() or pluralizer() or pluralFn().
	var globalize = new Globalize( cldr );
	return function( value ) {
		return globalize.plural( value );
	};
}

function MessageFormatInit( cldr ) {
	var locale = cldr.locale;
	return new MessageFormat( locale, Globalize.plural ? pluralFn( cldr ) : throwLoadPluralError );
}

/**
 * .loadMessages( json )
 *
 * @json [JSON]
 *
 * Load translation data.
 */
Globalize.loadMessages = function( json ) {
	var customData = {
		"globalize-messages": json
	};

	validateParameterPresence( json, "json" );
	validateParameterTypePlainObject( json, "json" );

	Cldr.load( customData );
};

/**
 * .messageFormatter( path )
 *
 * @path [String or Array]
 *
 * Format a message given its path.
 */
Globalize.messageFormatter =
Globalize.prototype.messageFormatter = function( path ) {
	var cldr, formatter, message;

	validateParameterPresence( path, "path" );
	validateParameterType( path, "path", typeof path === "string" || Array.isArray( path ),
		"a String nor an Array" );

	path = alwaysArray( path );
	cldr = this.cldr;

	validateDefaultLocale( cldr );

	message = cldr.get( [ "globalize-messages/{languageId}" ].concat( path ) );

	// TODO validate message presence and type.

	formatter = MessageFormatInit( this.cldr );
	formatter = formatter.compile( message );

	return function( variables ) {
		// TODO validate variables

		return formatter( variables );
	};
};

/**
 * .formatMessage( path [, variables] )
 *
 * @path [String or Array]
 *
 * @variables [Number, String, Array or Object]
 *
 * Format a message given its path.
 */
Globalize.formatMessage =
Globalize.prototype.formatMessage = function( path, variables ) {
	return this.messageFormatter( path )( variables );
};

return Globalize;

});
