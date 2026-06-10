import csv
import random
from pathlib import Path

# Common patterns
positive_reviews = [
    "Great product! The quality is absolutely amazing.",
    "Incredibly fast shipping, arrived much earlier than expected.",
    "Highly recommend this shop, wonderful customer service.",
    "Very satisfied with my purchase. It works perfectly.",
    "Absolutely love this device. Best purchase of the year!",
    "No problems at all. Solid hardware and easy to setup.",
    "This phone is gr8, battery life is awesome.",
    "Not bad at all, in fact it is an awsm product.",
    "Very easy to use, setup was a breeze. Perfect!",
    "Excellent value for money. Very durable material.",
    "The customer support staff was very helpful and responsive.",
    "No quality issues, everything is in perfect condition.",
    "Works like a charm, would buy again without hesitation.",
    "The screen display is incredibly clear and beautiful.",
    "Love the packaging, it was wrapped very nicely.",
    "It is an awesome product. I will buy it again.",
    "Never disappointed with this brand, always top tier.",
    "No delay in shipping, super happy with the delivery.",
    "The user interface is so smooth and intuitive. Love it.",
    "Not cheap, but totally worth every single penny.",
    "Highly functional and has zero flaws.",
    "The sound quality is fantastic and clear.",
    "Outstanding performance, it exceeded my expectations.",
    "Simply the best one on the market right now.",
    "Not a single issue so far. Very reliable.",
    "No complaints here, works exactly as described.",
    "Beautiful design and great build quality.",
    "Super light, compact, and extremely useful.",
    "Fast connection and never disconnects.",
    "The software is incredibly fast and responsive.",
    "No regrets buying this, highly recommended.",
    "Perfect fit and very comfortable to wear.",
    "Very robust and stands up to daily wear and tear.",
    "I can't believe how good this is for the price.",
    "Wow, this is an absolute game changer!",
    "Extremely pleased with how fast this works.",
    "No defects, clean packaging, and works like a dream.",
    "Great customer service, they resolved my issue in minutes.",
    "Very bright display and the colors are vibrant.",
    "No lag, games run super smooth on it.",
]

negative_reviews = [
    "Terrible product! A complete waste of money.",
    "Very disappointed with the hardware quality. It broke on day one.",
    "Late delivery and the package arrived damaged.",
    "The device keeps flickering and lags constantly. Terrible!",
    "Do not recommend this seller. Poor customer support.",
    "Fake item, a complete scam. Do not buy!",
    "Worst experience ever. The battery drains in two hours.",
    "Poor packaging and the item was broken inside.",
    "This is a scam. It does not work at all.",
    "Very expensive for such cheap material. Disappointed.",
    "The customer service was extremely rude and unhelpful.",
    "Cannot recommend this product, it lacks standard features.",
    "Very slow shipping and the item is defect.",
    "The setup was extremely hard and frustrating.",
    "Never buy this. Waste of time and money.",
    "Extremely bad design, hard to hold and uncomfortable.",
    "Doesn't work. The software crashes every time I open it.",
    "No customer support at all, they ignored my emails.",
    "Never again. This is absolute trash.",
    "Not worth the money, quality is very poor.",
    "It stopped working after just a few days of light usage.",
    "The worst packaging I have ever seen. Damaged box.",
    "No manual included, and setup is impossible.",
    "Extremely slow performance, laggy and unusable.",
    "Very disappointed. It looks nothing like the pictures.",
    "Not recommended. The product has major design flaws.",
    "Poor battery life, won't even last half a day.",
    "The camera quality is awful and blurry.",
    "It has a terrible chemical smell. Returning immediately.",
    "Extremely noisy, sounds like it's going to explode.",
    "Very cheap plastic, feels like a toy.",
    "The screen cracked easily without any drop. Fragile.",
    "No connectivity, bluetooth keeps dropping.",
    "Doesn't charge at all. Broken charging port.",
    "Completely useless. Do not waste your hard-earned money.",
    "The sizing is completely wrong, way too small.",
    "Terrible sound, very tinny and muffled.",
    "Not durable. It tore apart after the first wash.",
    "Horrible experience. The item was missing parts.",
    "No response from support, and return policy is a lie.",
]

neutral_reviews = [
    "The product is okay, does the job but nothing special.",
    "Average quality for the price. Not bad but not great.",
    "Delivery was a bit slow, but the item arrived safe.",
    "It is fine. Just an average smartphone.",
    "Not bad, but it lacks some advanced features.",
    "No issues so far, but it feels a bit basic.",
    "The battery is okay, screen is average.",
    "Just an average device, nothing to write home about.",
    "The package arrived on time, quality is decent.",
    "It works fine, but I expected more from this brand.",
    "The price is fair, but usability is just okay.",
    "Some aspects are good, others are quite disappointed.",
    "It is an average item. Neither good nor bad.",
    "Okay for basic usage, but not for heavy tasks.",
    "The shipping was ok, product is decent enough.",
    "Not bad, it is just okay.",
    "It works, but nothing outstanding.",
    "The design is simple, functionality is average.",
    "Average performance, nothing special about it.",
    "No major complaints, but it could be improved.",
    "It is alright for the price point.",
    "Nothing special, just a standard item.",
    "It is average. Some days it is fast, some days it is slow.",
    "Okay packaging, shipping was standard.",
    "Neither great nor terrible, just in the middle.",
    "It is a decent product, but has some limitations.",
    "The quality is passable, nothing to complain about.",
    "Not bad, but not particularly good either.",
    "It works as expected, nothing more, nothing less.",
    "Okay for the price, but don't expect miracles.",
    "Decent build, but the software is a bit slow.",
    "Standard product, does exactly what is advertised.",
    "Average battery life, average display.",
    "The color is slightly different but it works okay.",
    "No quality issues, but design is quite boring.",
    "It is okay. Not the best, but not the worst.",
    "It's fine. It does the job.",
    "Shipping took longer than expected, but product is ok.",
    "Decent packaging, product performs averagely.",
    "It's decent, fits the description but nothing exciting.",
]

def generate_dataset():
    data = []
    
    # Seed for deterministic generation
    rng = random.Random(42)
    
    # Generate 5000 reviews: 2000 positive, 2000 negative, 1000 neutral
    for i in range(2000):
        text = rng.choice(positive_reviews)
        rating = rng.choice([4, 5])
        prod_id = f"PROD_{rng.choice(['PHONE', 'LAPTOP', 'CLOTH', 'BEAUTY'])}_{rng.randint(100, 199)}"
        data.append({
            "review_id": f"rev_pos_{i}",
            "product_id": prod_id,
            "rating": rating,
            "review_text": text,
            "date": f"2026-06-{rng.randint(1, 9):02d}",
        })
        
    for i in range(2000):
        text = rng.choice(negative_reviews)
        rating = rng.choice([1, 2])
        prod_id = f"PROD_{rng.choice(['PHONE', 'LAPTOP', 'CLOTH', 'BEAUTY'])}_{rng.randint(200, 299)}"
        data.append({
            "review_id": f"rev_neg_{i}",
            "product_id": prod_id,
            "rating": rating,
            "review_text": text,
            "date": f"2026-06-{rng.randint(10, 19):02d}",
        })
        
    for i in range(1000):
        text = rng.choice(neutral_reviews)
        rating = 3
        prod_id = f"PROD_{rng.choice(['PHONE', 'LAPTOP', 'CLOTH', 'BEAUTY'])}_{rng.randint(300, 399)}"
        data.append({
            "review_id": f"rev_neu_{i}",
            "product_id": prod_id,
            "rating": rating,
            "review_text": text,
            "date": f"2026-06-{rng.randint(20, 28):02d}",
        })
        
    # Shuffle dataset
    rng.shuffle(data)
    
    # Save to data/sample_reviews.csv
    output_path = Path("data/sample_reviews.csv")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=["review_id", "product_id", "rating", "review_text", "date"])
        writer.writeheader()
        writer.writerows(data)
        
    print(f"Generated 5000 synthetic reviews to: {output_path}")

if __name__ == "__main__":
    generate_dataset()
