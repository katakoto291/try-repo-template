import { createGreeting } from "shared";

export const renderGreeting = (name: string): string => createGreeting(name).message;
