import datetime
import json
import random

final_data = []
start_date = datetime.date(2019, 1, 1) 
end_date = datetime.date(2023, 12, 31)   
values = [1000000]*50

def date_range(start_date, end_date):
    current_date = start_date
    while current_date <= end_date:
        yield current_date
        current_date += datetime.timedelta(days=1)

def generate_transaction():
    stock1 = random_integer = random.randint(0, 49)
    while(values[stock1]<100000):
        stock1 = random_integer = random.randint(0, 49)

    stock2 = random_integer = random.randint(0, 49)
    while(stock2==stock1):
        stock2 = random_integer = random.randint(0, 49)

    amount = random_integer = random.randint(10000, 100000)
    # values[stock1]-=amount
    # values[stock2]+=amount

    return [stock1,stock2,amount]

for date in date_range(start_date, end_date):
    print(date)
    [stock1, stock2, amount] = generate_transaction()
    data = {
        "date":date.strftime('%Y-%m-%d'),
        "from":stock1,
        "to":stock2,
        "amount":amount,
        "values":values[:]
    }
    final_data.append(data)
    values[stock1]-=amount
    values[stock2]+=amount

with open('fund_data.json', 'w') as file:
    json.dump(final_data, file, indent=4)
