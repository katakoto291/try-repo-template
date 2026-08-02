namespace Shared.Tests;

public class GreetingFactoryTests
{
    [Fact]
    public void CreateGreeting_ReturnsHelloMessage()
    {
        var greeting = GreetingFactory.CreateGreeting("world");

        Assert.Equal("Hello, world!", greeting.Message);
    }
}
