import yfinance as yf

# List of ticker symbols for the tech companies
tickers = [
    "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "INTC", "AMD", "CSCO", "AVGO",
    "TXN", "QCOM", "ADBE", "INTU", "PYPL", "ASML", "AMAT", "MU", "ZM", "ADSK",
    "NOW", "SHOP", "LRCX", "SNPS", "CDNS", "ZS", "OKTA", "CRWD", "TEAM", "DOCU",
    "FTNT", "DDOG", "SPLK", "PANW", "MRNA", "AKAM", "TWLO", "CTSH", "ADI", "KLAC",
    "SNOW", "HUBS", "VEEV", "CSGP", "VRSN", "CDW", "ETSY", "MELI", "ILMN", "CHKP"
]

# Download historical data for each ticker and save as CSV
for ticker in tickers:
    for year in range(2019, 2024):
        start_date = f"{year}-01-01"
        end_date = f"{year}-12-31"
        data = yf.download(ticker, start=start_date, end=end_date)
        filename = f"{ticker}_{year}.csv"
        data.to_csv(filename)
        print(f"Saved data for {ticker} in {year} to {filename}")