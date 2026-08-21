import { Calendar, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

const blogPosts = [
  {
    title: "How WhatsApp Booking Increased Our Clinic Revenue by 40%",
    excerpt:
      "Discover how Dr. Sharma's pediatric clinic transformed their appointment system and saw remarkable growth in just 3 months.",
    author: "Dr. Priya Sharma",
    date: "Jan 15, 2024",
    category: "Success Story",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    title: "5 Ways to Reduce Patient No-Shows in Your Clinic",
    excerpt:
      "Learn proven strategies to minimize missed appointments and maximize your clinic's efficiency with automated reminders.",
    author: "CatchQ Team",
    date: "Jan 10, 2024",
    category: "Tips & Tricks",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    title: "The Future of Digital Healthcare: Trends for 2024",
    excerpt: "Explore emerging trends in healthcare technology and how digital solutions are reshaping patient care.",
    author: "Dr. Rajesh Kumar",
    date: "Jan 5, 2024",
    category: "Industry Insights",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    title: "Patient Retention: Building Long-term Relationships",
    excerpt:
      "Discover how automated follow-ups and personalized care can significantly improve patient loyalty and retention.",
    author: "Dr. Anita Patel",
    date: "Dec 28, 2023",
    category: "Patient Care",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    title: "Implementing Queue Management: A Complete Guide",
    excerpt:
      "Step-by-step guide to setting up real-time queue management in your clinic for better patient experience.",
    author: "CatchQ Team",
    date: "Dec 20, 2023",
    category: "Implementation",
    image: "/placeholder.svg?height=200&width=300",
  },
  {
    title: "Digital Receipts: Going Paperless in Healthcare",
    excerpt:
      "Learn how digital receipts can streamline your billing process while providing better service to patients.",
    author: "Dr. Mohammed Ali",
    date: "Dec 15, 2023",
    category: "Technology",
    image: "/placeholder.svg?height=200&width=300",
  },
]

export function Blogs() {
  return (
    <section id="blogs" className="py-20 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Latest from Our Blog</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest trends, tips, and success stories in healthcare management and digital
            transformation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogPosts.map((post, index) => (
            <article
              key={index}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <Image src={post.image || "/placeholder.svg"} alt={post.title} width={400} height={192} className="w-full h-48 object-cover" />
              <div className="p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <span className="bg-[#1BBA8B]/10 text-[#1BBA8B] px-3 py-1 rounded-full text-sm font-medium">
                    {post.category}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">{post.title}</h3>
                <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[#1BBA8B] hover:text-[#164772]">
                    Read More
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button className="bg-[#164772] hover:bg-[#1BBA8B]">View All Blog Posts</Button>
        </div>
      </div>
    </section>
  )
}
