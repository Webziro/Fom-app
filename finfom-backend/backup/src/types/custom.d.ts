declare module 'xss-clean';
declare module 'hpp';

// Allow importing JS modules without type declarations
declare module '*-js' {
  const content: any;
  export default content;
}
