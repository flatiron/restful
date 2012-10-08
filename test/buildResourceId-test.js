var assert = require('assert'),
		vows = require('vows'),
		buildResourceId = require('../lib/restful').buildResourceId,
		brid = buildResourceId;

vows.describe('restful/buildResourceId').addBatch({
	'The resource id builder': {
		'Handles "parents" correctly"': function() {
			var out = brid([], ['myid']);
			assert.equal(out, 'myid');
		},
		'Handles single level children correctly': function() {
			var out = brid(['type1', 'type2'], ['id1', 'id2']);
			assert.equal(out, 'type1/id1/id2');

			var out2 = brid(['type1'], ['id1', 'id2']);
			assert.equal(out, 'type1/id1/id2');		
		},
		'Handles more children correctly': function() {
			var out = brid(['type1', 'type2', 'type3'], ['id1', 'id2', 'id3']);
			assert.equal(out, 'type2/type1/id1/id2/id3');
		}
	}
})
.export(module);