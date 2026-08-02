using Shared;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.MapGet("/greeting/{name}", (string name) => GreetingFactory.CreateGreeting(name))
    .WithName("GetGreeting")
    .WithOpenApi();

app.Run();

public partial class Program;
