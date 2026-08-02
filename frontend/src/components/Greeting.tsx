import { createGreeting } from "@repo/shared";

export type GreetingProps = {
  name: string;
};

export function Greeting({ name }: GreetingProps) {
  return <p>{createGreeting(name).message}</p>;
}
