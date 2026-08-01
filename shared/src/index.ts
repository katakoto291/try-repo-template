export interface Greeting {
  message: string;
}

export const createGreeting = (name: string): Greeting => ({
  message: `Hello, ${name}!`,
});
