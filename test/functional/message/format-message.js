define([
	"globalize",
	"json!fixtures/cldr/supplemental/likelySubtags.json",
	"../../util",
	"cldr/event",
	"cldr/unresolved",
	"globalize/message",
	"globalize/plural"
], function( Globalize, likelySubtags, util ) {

QUnit.module( ".formatMessage( path )", {
	setup: function() {
		Globalize.load( likelySubtags );
		Globalize.loadMessages({
			root: {
				amen: "Amen"
			},
			pt: {
				amen: "Amém"
			},
			zh: {
				amen: "阿门"
			},
			en: {
				greetings: {
					hello: "Hello",
					helloYou: "Hello, {name}"
				},
				tasks: [
					"You have {count, plural,",
						"  one {one task}",
						"other {# tasks}",
					"} remaining"
				].join( " " )
			}
		});
	},
	teardown: util.resetCldrContent
});

QUnit.test( "should validate parameters", function( assert ) {
	util.assertParameterPresence( assert, "path", function() {
		Globalize.formatMessage();
	});

	util.assertPathParameter( assert, "path", function( invalidValue ) {
		return function() {
			Globalize.formatMessage( invalidValue );
		};
	});
});

QUnit.test( "should return the loaded translation", function( assert ) {
	assert.equal( Globalize( "pt" ).formatMessage( "amen" ), "Amém" );
	assert.equal( Globalize( "zh" ).formatMessage( "amen" ), "阿门" );
});

QUnit.test( "should traverse the translation data", function( assert ) {
	assert.equal( Globalize( "en" ).formatMessage( "greetings/hello" ), "Hello" );
	assert.equal( Globalize( "en" ).formatMessage([ "greetings", "hello" ]), "Hello" );
});

QUnit.test( "should return inherited translation if cldr/unresolved is loaded", function( assert ) {
	assert.equal( Globalize( "en" ).formatMessage( "amen" ), "Amen" );
	assert.equal( Globalize( "de" ).formatMessage( "amen" ), "Amen" );
	assert.equal( Globalize( "en-GB" ).formatMessage( "amen" ), "Amen" );
	assert.equal( Globalize( "fr" ).formatMessage( "amen" ), "Amen" );
	assert.equal( Globalize( "pt-PT" ).formatMessage( "amen" ), "Amém" );
});

QUnit.test( "should support ICU message format", function( assert ) {

	// Var replacement
	assert.equal( Globalize( "en" ).formatMessage( "greetings/helloYou", {
		name: "Beethoven"
	}), "Hello, Beethoven" );

	assert.equal( Globalize( "en" ).formatMessage( "tasks", {
		count: 123
	}), "You have 123 tasks remaining" );
});

});
