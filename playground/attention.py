import torch.nn as nn


class MultiHeadAttention(nn.Module):
    def __init__(self, dtype, n_heads: int = 4, d_model: int = 32) -> None:
        super().__init__()
        assert d_model % n_heads == 0, "n_heads should be a factor of d_model"
        self.dtype = dtype
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_heads = d_model // n_heads

        self.W_q = nn.Linear(d_model, d_model, dtype=self.dtype)
        self.W_k = nn.Linear(d_model, d_model, dtype=self.dtype)
        self.W_v = nn.Linear(d_model, d_model, dtype=self.dtype)
        self.W_o = nn.Linear(d_model, d_model, dtype=self.dtype)

    def forward(self, x):
        if x.dtype != self.dtype:
            x.dtype = x.to(self.dtype)
        batch, seqlen, d_model = x.shape
        q = self.W_q(x)
        k = self.W_k(x)
        v = self.W_v(x)

        q = q.view(batch, seqlen, self.n_heads, self.d_heads).transpose(1, 2)
        k = k.view(batch, seqlen, self.n_heads, self.d_heads).transpose(1, 2)
        v = v.view(batch, seqlen, self.n_heads, self.d_heads).transpose(1, 2)

        attn_scores = q @ k.transpose(-1, -2)
        attn_weights = torch.softmax(attn_scores / self.d_heads**0.5, dim=-1)

        attn_output = attn_weights @ v
        attn_output_concat = (
            attn_output.transpose(1, 2).contiguous().view(batch, seqlen, d_model)
        )

        proj_output = self.W_o(attn_output_concat)
        return (
            q,
            attn_scores,
            attn_weights,
            attn_output,
            attn_output_concat,
            proj_output,
        )


if __name__ == "__main__":
    import torch

    x = torch.randn(1, 3, 32, dtype=torch.float16)
    mha = MultiHeadAttention(n_heads=4, d_model=x.shape[-1], dtype=torch.float16)
    q, attn_scores, attn_weights, attn_output, attn_output_concat, proj_output = mha(x)
    print(f"q: {q.shape}")
    print(f"attn_scores: {attn_scores.shape}")
    print(f"attn_weights: {attn_weights.shape}")
    print(f"attn_output: {attn_output.shape}")
    print(f"attn_output_concat: {attn_output_concat.shape}")
    print(f"proj_output: {proj_output.shape}")
