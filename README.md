# Polity

A platform that models how a real government works. Though it's not a real government system and does not use real official data. It is a experience you can log into, explore, and run "what if" scenarios on.

# What this actually is?

Think of it as a working model of Pakistan's government, built the same way you would build any software product, except the "product" here is a country. It covers how the government is structured, how elections work, how budgets get approved, how ministries run their sectors, and how policy decisions move from an idea to something implemented. On top of that, there is a practice process that lets you change something (a budget, a tax rate, a policy) and see a projected effect on things like literacy, employment or healthcare access.

It uses real Pakistani provinces and the real administrative structure (federal, provincial, district, tehsil, city), but the numbers inside it (population, budgets, indicators) are made up to look realistic. Nothing in this project should be read as actual government data.

# Why it exists?

This project is designed to be a building a, multi part backend and frontend system with real business logic in it. Government is a good subject for this because it naturally has almost every kind of logic a real product needs: users and roles, approval workflows, money and budgets, public facing views, and data that changes over time.

# What it covers?

Government structure: federal, provincial, district and city levels, ministries and departments
Elections: parties, candidates, constituencies, voting, results
Government formation: cabinet and leadership after an election
Budgets and finance: revenue, budget allocation, spending, procurement
Sector programs: education, healthcare, agriculture, infrastructure, labor
Defense and national security, kept at an administrative level only (budget, personnel numbers, training, procurement, disaster response). No military tactics or operational details of any kind
Policy workflow: how a policy idea moves from draft to approved to implemented
A sim engine that projects the effect of policy or budget changes
An AI assistant that explains policies, budgets and simulation results in plain English or Urdu

# Who can use it?

The platform has different roles, each seeing only what they are allowed to see. A provincial minister can manage their own province's education budget but cannot touch the national budget or election results. There is also a public, read only view so anyone can look at budgets, election results and active policies without logging in.

You can also save your own simulation scenarios and come back to them later, or share one with another user.

# The AI part

The AI does not make any decisions. It explains things. Ask it to explain a policy, break down why a budget changed, or translate something between English and Urdu, and it answers in both languages depending on what you need. Every answer it gives comes with what it assumed and how confident it is, and anything sensitive still needs a human to actually approve it. It runs locally through Ollama, so there is no paid API cost.

# Tech stack

Backend: FastAPI (Python), PostgreSQL, Redis
Frontend: React with Vite, Tailwind CSS
AI: Ollama, running a local open source model
Everything runs in Docker through Docker Compose
Running it locally
Copy .env.example to .env and fill in your own values
Run docker compose up
Pull the AI model once with docker compose exec ollama ollama pull llama3.1:8b
Backend runs at http://localhost:8004, frontend at http://localhost:5182

# A note on the data

Every number in this project is made up to look plausible. It is not sourced from any government agency and should never be treated as real. This exists purely to build a software for better understanding, not to represent anyone's actual government.
