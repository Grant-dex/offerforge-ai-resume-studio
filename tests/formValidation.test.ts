import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidEmail, isPresentDate, validateExperienceDates } from '../src/utils/formValidation.ts';
test('date validation compares actual months rather than text order', () => {
  assert.equal(validateExperienceDates('2024-2','2024-10').invalid,false);
  assert.equal(validateExperienceDates('2024-10','2024-2').invalid,true);
  assert.equal(validateExperienceDates('2024/02','2024.03').invalid,false);
});
test('rejects invalid calendar dates including non leap February', () => {
  for (const date of ['2023-02-29','2024-02-30','2024-13','2024-00','2024-04-31','2024-2-0','not a date']) assert.equal(validateExperienceDates(date,'').invalid,true,date);
  assert.equal(validateExperienceDates('2024-02-29','2024-03-01').invalid,false);
});
test('month granularity does not invent a contradictory day', () => {
  assert.equal(validateExperienceDates('2024-06-20','2024-06').invalid,false);
  assert.equal(validateExperienceDates('2024-06','2024-06-01').invalid,false);
  assert.equal(validateExperienceDates('2024-06-20','2024-06-19').invalid,true);
});
test('blank drafts and ongoing experience stay editable', () => {
  assert.equal(validateExperienceDates('','').invalid,false);
  for (const end of ['至今','Present',' current ']) {
    assert.equal(isPresentDate(end),true);
    assert.equal(validateExperienceDates('2024-06',end).invalid,false);
  }
  assert.equal(validateExperienceDates('至今','2024-06').invalid,true);
});
test('email checks ignore outer whitespace but reject malformed addresses', () => {
  assert.equal(isValidEmail(' name+jobs@example.com '),true);
  for (const address of ['','name@','name@example','name @example.com','name@@example.com']) assert.equal(isValidEmail(address),false);
});
