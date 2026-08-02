namespace Shared;

public sealed record Greeting(string Message);

public static class GreetingFactory
{
    public static Greeting CreateGreeting(string name) => new($"Hello, {name}!");
}
