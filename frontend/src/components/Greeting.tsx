import { createGreeting } from "@repo/shared";

export type GreetingProps = {
  name: string;
};

export const Greeting = ({ name }: GreetingProps) => (
  <p>{createGreeting(name).message}</p>
);
