define([
	"./pattern-re",
	"./start-of",
	"../common/create-error/unsupported-feature",
	"../util/date/set-date",
	"../util/date/set-month"
], function( datePatternRe, dateStartOf, createErrorUnsupportedFeature, dateSetDate,
	dateSetMonth ) {

function outOfRange( value, low, high ) {
	return value < low || value > high;
}

/**
 * parse( value, tokens, properties )
 *
 * @value [String] string date.
 *
 * @tokens [Object] tokens returned by date/tokenizer.
 *
 * @properties [Object] output returned by date/tokenizer-properties.
 *
 * ref: http://www.unicode.org/reports/tr35/tr35-dates.html#Date_Format_Patterns
 */
return function( value, tokens, properties ) {
	var amPm, era, hour, hour12, timezoneOffset, valid,
		YEAR = 0,
		MONTH = 1,
		DAY = 2,
		HOUR = 3,
		MINUTE = 4,
		SECOND = 5,
		MILLISECONDS = 6,
		date = new Date(),
		truncateAt = [],
		units = [ "year", "month", "day", "hour", "minute", "second", "milliseconds" ];

	if ( !tokens.length ) {
		return null;
	}

	valid = tokens.every(function( token ) {
		var century, chr, value, length;

		if ( token.type === "literal" ) {
			// continue
			return true;
		}

		chr = token.type.charAt( 0 );
		length = token.type.length;

		if ( chr === "j" ) {
			// Locale preferred hHKk.
			// http://www.unicode.org/reports/tr35/tr35-dates.html#Time_Data
			chr = properties.preferredTimeData;
		}

		switch ( chr ) {

			// Era
			case "G":
				truncateAt.push( YEAR );
				era = +token.value;
				break;

			// Year
			case "y":
				value = +token.lexeme;
				if ( length === 2 ) {
					if ( outOfRange( value, 0, 99 ) ) {
						return false;
					}
					// mimic dojo/date/locale: choose century to apply, according to a sliding
					// window of 80 years before and 20 years after present year.
					century = Math.floor( date.getFullYear() / 100 ) * 100;
					value += century;
					if ( value > date.getFullYear() + 20 ) {
						value -= 100;
					}
				}
				date.setFullYear( value );
				truncateAt.push( YEAR );
				break;

			case "Y": // Year in "Week of Year"
				throw createErrorUnsupportedFeature({
					feature: "year pattern `" + chr + "`"
				});

			// Quarter (skip)
			case "Q":
			case "q":
				break;

			// Month
			case "M":
			case "L":
				if ( length <= 2 ) {
					value = +token.lexeme;
				} else {
					value = +token.value;
				}
				if ( outOfRange( value, 1, 12 ) ) {
					return false;
				}
				dateSetMonth( date, value - 1 );
				truncateAt.push( MONTH );
				break;

			// Week (skip)
			case "w": // Week of Year.
			case "W": // Week of Month.
				break;

			// Day
			case "d":
				value = +token.lexeme;
				if ( outOfRange( value, 1, 31 ) ) {
					return false;
				}
				dateSetDate( date, value );
				truncateAt.push( DAY );
				break;

			case "D":
				value = +token.lexeme;
				if ( outOfRange( value, 1, 366 ) ) {
					return false;
				}
				date.setMonth(0);
				date.setDate( value );
				truncateAt.push( DAY );
				break;

			case "F":
				// Day of Week in month. eg. 2nd Wed in July.
				// Skip
				break;

			// Week day
			case "e":
			case "c":
			case "E":
				// Skip.
				// value = arrayIndexOf( dateWeekDays, token.value );
				break;

			// Period (AM or PM)
			case "a":
				amPm = token.value;
				break;

			// Hour
			case "h": // 1-12
				value = +token.lexeme;
				if ( outOfRange( value, 1, 12 ) ) {
					return false;
				}
				hour = hour12 = true;
				date.setHours( value === 12 ? 0 : value );
				truncateAt.push( HOUR );
				break;

			case "K": // 0-11
				value = +token.lexeme;
				if ( outOfRange( value, 0, 11 ) ) {
					return false;
				}
				hour = hour12 = true;
				date.setHours( value );
				truncateAt.push( HOUR );
				break;

			case "k": // 1-24
				value = +token.lexeme;
				if ( outOfRange( value, 1, 24 ) ) {
					return false;
				}
				hour = true;
				date.setHours( value === 24 ? 0 : value );
				truncateAt.push( HOUR );
				break;

			case "H": // 0-23
				value = +token.lexeme;
				if ( outOfRange( value, 0, 23 ) ) {
					return false;
				}
				hour = true;
				date.setHours( value );
				truncateAt.push( HOUR );
				break;

			// Minute
			case "m":
				value = +token.lexeme;
				if ( outOfRange( value, 0, 59 ) ) {
					return false;
				}
				date.setMinutes( value );
				truncateAt.push( MINUTE );
				break;

			// Second
			case "s":
				value = +token.lexeme;
				if ( outOfRange( value, 0, 59 ) ) {
					return false;
				}
				date.setSeconds( value );
				truncateAt.push( SECOND );
				break;

			case "A":
				date.setHours( 0 );
				date.setMinutes( 0 );
				date.setSeconds( 0 );

			/* falls through */
			case "S":
				value = Math.round( +token.lexeme * Math.pow( 10, 3 - length ) );
				date.setMilliseconds( value );
				truncateAt.push( MILLISECONDS );
				break;

			// Zone
			case "Z":
			case "z":
			case "O":
			case "X":
			case "x":
				timezoneOffset = token.value - date.getTimezoneOffset();
				break;

		}

		return true;
	});

	if ( !valid ) {
		return null;
	}

	// 12-hour format needs AM or PM, 24-hour format doesn't, ie. return null
	// if amPm && !hour12 || !amPm && hour12.
	if ( hour && !( !amPm ^ hour12 ) ) {
		return null;
	}

	if ( era === 0 ) {
		// 1 BC = year 0
		date.setFullYear( date.getFullYear() * -1 + 1 );
	}

	if ( hour12 && amPm === "pm" ) {
		date.setHours( date.getHours() + 12 );
	}

	if ( timezoneOffset ) {
		date.setMinutes( date.getMinutes() + timezoneOffset );
	}

	// Truncate date at the most precise unit defined. Eg.
	// If value is "12/31", and pattern is "MM/dd":
	// => new Date( <current Year>, 12, 31, 0, 0, 0, 0 );
	truncateAt = Math.max.apply( null, truncateAt );
	date = dateStartOf( date, units[ truncateAt ] );

	return date;
};

});
