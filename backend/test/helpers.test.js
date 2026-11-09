import test from 'node:test';import assert from 'node:assert/strict';
import {daysFrom,fineFor,validObjectId,pagination} from '../src/utils/helpers.js';
test('no overdue fine before due date',()=>assert.equal(fineFor('2026-11-10','2026-11-09',5),0));
test('fine for two days late',()=>assert.equal(fineFor('2026-11-10','2026-11-12',5),10));
test('partial overdue day rounds up',()=>assert.equal(fineFor('2026-11-10T00:00:00Z','2026-11-10T00:01:00Z',5),5));
test('loan period',()=>assert.equal(daysFrom('2026-11-01T00:00:00Z',14).toISOString(),'2026-11-15T00:00:00.000Z'));
test('object id validation',()=>{assert.equal(validObjectId('507f1f77bcf86cd799439011'),true);assert.equal(validObjectId('bad-id'),false);});
test('pagination caps limit',()=>assert.deepEqual(pagination({query:{page:'2',limit:'500'}}),{page:2,limit:100,skip:100}));
