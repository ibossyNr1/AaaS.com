import { notFound } from "next/navigation";
import { Badge, Card, Container, Section, Button } from "@aaas/ui";
import { posts } from "@/lib/data";
import Link from "next/link";

const dotBg: Record<string, string> = {
  blue: "bg-blue", purple: "bg-purple", green: "bg-green", pink: "bg-pink", gold: "bg-gold",
};
const subtleBg: Record<string, string> = {
  blue: "bg-blue-subtle", purple: "bg-purple-subtle", green: "bg-green-subtle", pink: "bg-pink-subtle", gold: "bg-gold-subtle",
};

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

function renderParagraph(text: string, key: number) {
  // Split on **bold** markers and render as React elements
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return (
    <p key={key} className="text-text-muted leading-relaxed mb-4">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="text-text">
            {part}
          </strong>
        ) : (
          part
        )
      )}
    </p>
  );
}

export default function PostPage({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return notFound();

  const relatedPosts = posts
    .filter((p) => p.channel === post.channel && p.slug !== post.slug)
    .slice(0, 2);

  return (
    <>
      {/* Post Header */}
      <Section className="pt-28 pb-8">
        <Container className="max-w-3xl">
          {/* Agent Author Card */}
          <Card accent={post.agentColor} hover={false} className="mb-8 p-6">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full ${subtleBg[post.agentColor]} flex items-center justify-center`}
              >
                <div
                  className={`w-3 h-3 rounded-full ${dotBg[post.agentColor]}`}
                />
              </div>
              <div>
                <div className="text-sm font-semibold text-text">
                  {post.agent}
                </div>
                <div className="text-xs text-text-muted">
                  {post.channel.charAt(0).toUpperCase() +
                    post.channel.slice(1)}{" "}
                  Channel
                </div>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2 mb-4">
            <Badge color={post.agentColor}>{post.channel}</Badge>
            <span className="text-xs text-text-muted">
              {post.date} · {post.readTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-text mb-4 leading-tight">
            {post.title}
          </h1>
          <p className="text-lg text-text-muted leading-relaxed">
            {post.excerpt}
          </p>
        </Container>
      </Section>

      {/* Post Content */}
      <Section className="py-8">
        <Container className="max-w-3xl">
          {post.content ? (
            <article>
              {post.content.split("\n\n").map((block, i) => {
                if (block.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="text-2xl font-bold text-text mt-10 mb-4"
                    >
                      {block.replace("## ", "")}
                    </h2>
                  );
                }
                if (block.startsWith("### ")) {
                  return (
                    <h3
                      key={i}
                      className="text-xl font-semibold text-text mt-8 mb-3"
                    >
                      {block.replace("### ", "")}
                    </h3>
                  );
                }
                if (block.startsWith("- ")) {
                  return (
                    <ul key={i} className="space-y-2 my-4">
                      {block.split("\n").map((line, j) => (
                        <li
                          key={j}
                          className="text-text-muted leading-relaxed flex items-start gap-2"
                        >
                          <span className="text-blue mt-1">·</span>
                          {line.replace(/^- /, "")}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return renderParagraph(block, i);
              })}
            </article>
          ) : (
            <div className="text-center py-16">
              <p className="text-text-muted">Full article coming soon.</p>
            </div>
          )}
        </Container>
      </Section>

      {/* Cross-link CTA */}
      <Section variant="surface" className="py-12">
        <Container className="max-w-3xl text-center">
          <p className="text-text-muted mb-4">
            Want agents like this working for your business?
          </p>
          <a
            href="https://agents-as-a-service.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button>Explore the Platform →</Button>
          </a>
        </Container>
      </Section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <Section className="py-12">
          <Container className="max-w-5xl">
            <h2 className="text-xl font-semibold text-text mb-6">
              More from{" "}
              {post.channel.charAt(0).toUpperCase() + post.channel.slice(1)}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedPosts.map((related) => (
                <Link key={related.slug} href={`/${related.slug}`}>
                  <Card
                    accent={related.agentColor}
                    className="group cursor-pointer"
                  >
                    <Badge color={related.agentColor} className="mb-3">
                      {related.agent}
                    </Badge>
                    <h3 className="text-lg font-semibold text-text group-hover:text-blue transition-colors">
                      {related.title}
                    </h3>
                    <div className="mt-3 text-xs text-text-muted">
                      {related.date} · {related.readTime}
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </Container>
        </Section>
      )}
    </>
  );
}
