using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Shared;

namespace Backend.Tests;

public class GreetingEndpointTests(WebApplicationFactory<Program> factory) : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetGreeting_ReturnsHelloMessage()
    {
        var client = factory.CreateClient();

        var greeting = await client.GetFromJsonAsync<Greeting>("/greeting/world");

        Assert.Equal("Hello, world!", greeting?.Message);
    }
}
