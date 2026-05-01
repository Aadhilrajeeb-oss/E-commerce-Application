CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE RESTRICT,
    stripe_payment_id VARCHAR(255),
    method VARCHAR(100),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    status VARCHAR(100) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_stripe_payment_id ON payments(stripe_payment_id);
