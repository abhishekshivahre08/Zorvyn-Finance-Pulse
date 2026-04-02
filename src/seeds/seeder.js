require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const dns = require("dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Transaction = require("../models/Transaction");

const connectDB = async() => {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/finance_dashboard");
    console.log("✅ MongoDB Connected for seeding");
};

const users = [
    { name: "Super Admin", email: "admin@finance.com", password: "admin123", role: "admin", status: "active" },
    { name: "Ravi Analyst", email: "analyst@finance.com", password: "analyst123", role: "analyst", status: "active" },
    { name: "Priya Viewer", email: "viewer@finance.com", password: "viewer123", role: "viewer", status: "active" },
    { name: "Amit Kumar", email: "amit@finance.com", password: "amit123", role: "viewer", status: "active" },
];

const generateTransactions = (adminId) => {
    const now = new Date();
    const transactions = [];

    const incomeEntries = [
        { title: "Monthly Salary", amount: 85000, category: "salary" },
        { title: "Freelance Web Project", amount: 25000, category: "freelance" },
        { title: "Stock Dividend", amount: 8500, category: "investment" },
        { title: "Consulting Income", amount: 15000, category: "business" },
        { title: "Rental Income", amount: 12000, category: "rental" },
        { title: "Bonus Payment", amount: 20000, category: "salary" },
        { title: "Freelance Design Work", amount: 18000, category: "freelance" },
        { title: "Mutual Fund Returns", amount: 6500, category: "investment" },
    ];

    const expenseEntries = [
        { title: "House Rent", amount: 22000, category: "housing" },
        { title: "Grocery Shopping", amount: 4500, category: "food" },
        { title: "Electricity Bill", amount: 2200, category: "utilities" },
        { title: "Metro + Cab Rides", amount: 3100, category: "transport" },
        { title: "Restaurant Dinner", amount: 2800, category: "food" },
        { title: "Internet Bill", amount: 999, category: "utilities" },
        { title: "Mobile Recharge", amount: 599, category: "utilities" },
        { title: "Doctor Visit", amount: 1500, category: "healthcare" },
        { title: "Medicine Purchase", amount: 850, category: "healthcare" },
        { title: "Online Course - React", amount: 4999, category: "education" },
        { title: "Netflix + Spotify", amount: 1200, category: "entertainment" },
        { title: "Amazon Shopping", amount: 5600, category: "shopping" },
        { title: "Goa Trip - Flights", amount: 12000, category: "travel" },
        { title: "Fuel - Petrol", amount: 3000, category: "transport" },
        { title: "Gym Membership", amount: 2500, category: "healthcare" },
    ];

    // Generate transactions for last 6 months
    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
        const monthDate = new Date(now);
        monthDate.setMonth(now.getMonth() - monthOffset);

        // Add income entries for each month
        incomeEntries.forEach((entry, idx) => {
            if (idx < 4 || monthOffset < 3) { // More variety in recent months
                const date = new Date(monthDate);
                date.setDate(Math.floor(Math.random() * 28) + 1);
                if (date <= now) {
                    transactions.push({
                        ...entry,
                        type: "income",
                        date,
                        notes: `${entry.title} - ${date.toLocaleString("en-IN", { month: "long", year: "numeric" })}`,
                        createdBy: adminId,
                    });
                }
            }
        });

        // Add expense entries for each month
        expenseEntries.forEach((entry) => {
            const date = new Date(monthDate);
            date.setDate(Math.floor(Math.random() * 28) + 1);
            if (date <= now) {
                const variance = 1 + (Math.random() * 0.2 - 0.1); // ±10% variance
                transactions.push({
                    ...entry,
                    amount: Math.round(entry.amount * variance),
                    type: "expense",
                    date,
                    notes: `${entry.title} - ${date.toLocaleString("en-IN", { month: "long", year: "numeric" })}`,
                    createdBy: adminId,
                });
            }
        });
    }

    return transactions;
};

const seedDatabase = async() => {
    try {
        await connectDB();

        console.log("🗑️  Clearing existing data...");
        await User.deleteMany({});
        await Transaction.deleteMany({});

        console.log("👤 Creating users...");
        const createdUsers = await User.create(users);
        const admin = createdUsers.find((u) => u.role === "admin");
        console.log(`   ✅ ${createdUsers.length} users created`);

        console.log("💸 Creating transactions...");
        const transactions = generateTransactions(admin._id);
        await Transaction.insertMany(transactions);
        console.log(`   ✅ ${transactions.length} transactions created`);

        console.log("\n🎉 Database seeded successfully!\n");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📋 Test Credentials:");
        console.log("   Admin   → admin@finance.com    / admin123");
        console.log("   Analyst → analyst@finance.com  / analyst123");
        console.log("   Viewer  → viewer@finance.com   / viewer123");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error.message);
        process.exit(1);
    }
};

seedDatabase();