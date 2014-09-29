define([
	"cldr",
	"messageformat",
	"./core",
	"./common/validate/default-locale",
	"./common/validate/parameter-presence",
	"./common/validate/parameter-type",
	"./common/validate/parameter-type/plain-object",
	"./util/always-array"
], function( Cldr, MessageFormat, Globalize, validateDefaultLocale, validateParameterPresence,
	validateParameterType, validateParameterTypePlainObject, alwaysArray ) {

var MessageFormatRuntime;

function MessageFormatInit( cldr ) {
	var locale = cldr.locale,

		// MessageFormat( locale, fn ) will throw error if fn is not passed. It doesn't matter what fn
		// is passed, because it uses MessageFormatRuntime.lc.
		messageFormat = new MessageFormat( locale, function() {} );

	if ( Globalize.plural ) {
		// FIXME: depends on the yet-to-be-created plural generator:
		// pluralFormatter() or pluralizer() or pluralFn().
		/*
		MessageFormatRuntime.lc[ locale ] = function( value ) {
			return new Globalize( cldr ).plural( value );
		};
		*/
		MessageFormatRuntime.lc[ locale ] = function() {
			return "other";
		};
	} else {
		MessageFormatRuntime.lc[ locale ] = function() {
			// FIXME use createError().
			throw new Error( "Load globalize/plural" );
		};
	}
	return messageFormat;
}

/* jshint ignore:start */
MessageFormatRuntime = {
	lc: {},
	c:function(d,k){if(!d)throw new Error("MessageFormat: Data required for '"+k+"'.")},
	n:function(fns,d,k,o){if(isNaN(d[k]))throw new Error("MessageFormat: '"+k+"' isn't a number.");return d[k]-(o||0)},
	v:function(fns,d,k){fns.c(d,k);return d[k]},
	p:function(fns,d,k,o,l,p){fns.c(d,k);return d[k] in p?p[d[k]]:(k=fns.lc[l](d[k]-o),k in p?p[k]:p.other)},
	s:function(fns,d,k,p){fns.c(d,k);return d[k] in p?p[d[k]]:p.other}
};
/* jshint ignore:end */

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

	formatter = formatter.precompile( formatter.parse( message ) )

	// hack - pass runtime fns
		.replace( /^function\(d\)\{/, "" )
		.replace( /\}$/, "" )
		.replace( /i18n\.(.)\(d/g, "fns.$1(fns,d" );

	/* jshint evil: true */
	/* globals console */
	console.log( "=>", formatter );
	formatter = new Function("fns", "d", formatter);

	return function( variables ) {
		// TODO validate variables

		return formatter( MessageFormatRuntime, variables );
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
