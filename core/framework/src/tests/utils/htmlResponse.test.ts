import { describe, it, expect } from 'bun:test';
import { htmlErrorString } from '../../utils/html-response'; // Adjusted path

describe('htmlErrorString', () => {
  it('should generate a valid HTML error string', () => {
    const title = 'Test Error Title';
    const heading = 'Test Error Heading';
    const message = 'This is a test error message.';

    const result = htmlErrorString(title, heading, message);

    expect(result).toContain(`<title>${title}</title>`);
    expect(result).toContain(`<h1>${heading}</h1>`);
    expect(result).toContain(`<p>${message}</p>`);
    expect(result).toMatch(/^<!DOCTYPE html><html lang="en">.*<\/html>$/);
  });

  it('should handle empty strings gracefully', () => {
    const result = htmlErrorString('', '', '');
    expect(result).toContain('<title></title>');
    expect(result).toContain('<h1></h1>');
    expect(result).toContain('<p></p>');
  });

  it('should include default styling snippet', () => {
    const result = htmlErrorString('T', 'H', 'M');
    expect(result).toContain('<style>body{font-family:sans-serif;padding:20px;}</style>');
  });
}); 