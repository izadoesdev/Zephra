export const htmlErrorString = (title: string, heading: string, message: string): string => {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${title}</title><style>body{font-family:sans-serif;padding:20px;}</style></head><body><h1>${heading}</h1><p>${message}</p></body></html>`;
}; 