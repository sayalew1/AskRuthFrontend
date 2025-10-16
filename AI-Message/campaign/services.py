# campaign/services.py
import threading, uuid, json, traceback
import re
import ipaddress
from urllib.parse import urlparse
import faiss
import numpy as np
import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
from django.conf import settings
from django.core.cache import cache
import os
from openai import AzureOpenAI

AZURE_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
AZURE_CHAT_DEPLOYMENT = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT", "gpt-4o")
AZURE_EMBED_DEPLOYMENT = os.getenv("AZURE_OPENAI_EMBED_DEPLOYMENT", "text-embedding-3-small")

# Initialize Azure client only if credentials are available
azure_client = None
if AZURE_ENDPOINT and AZURE_KEY:
    try:
        azure_client = AzureOpenAI(
            azure_endpoint=AZURE_ENDPOINT,
            api_key=AZURE_KEY,
            api_version=AZURE_API_VERSION,
        )
    except Exception as e:
        print(f"Warning: Could not initialize Azure OpenAI client: {e}")
        azure_client = None
else:
    print("Warning: Azure OpenAI credentials not found. Some features may not work.")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

debug = settings.DEBUG

main_cause = {"womens_rights": """Women's rights encompass a broad range of liberties and entitlements that are integral to achieving gender equality and ensuring the dignity, autonomy, and security of women and girls worldwide. These rights include, but are not limited to, the right to live free from violence and discrimination, access to education, health care, economic opportunities, and political participation.
                   Employment and Economic Rights: Women's economic rights are crucial for their empowerment, encompassing the right to work in an environment free from discrimination, to receive equal pay for equal work, and to have access to all professions. Female labor force participation is not only a matter of economic independence for women but also a significant contributor to the overall economic development of societies.
                   Health Rights: Women's health rights include the right to the highest attainable standard of physical and mental health. This encompasses a wide range of issues, from maternal health to the prevention and treatment of diseases affecting women. Ensuring women have access to comprehensive health care services, including reproductive health care, is vital for their well-being and autonomy over their bodies.
                   Political Rights and Participation: Women's political rights include the right to vote, run for public office, and participate in decision-making processes at all levels. Despite progress in some areas, women remain underrepresented in political and leadership roles globally, which hampers the development of inclusive and equitable policies.
                   Education Rights: Education is a cornerstone for women's empowerment. The right to education for girls and women is fundamental to breaking the cycles of discrimination and poverty. Educated women are more likely to participate in the labor market, have fewer and healthier children, and provide better health care and education to their children.
                   Legal and Social Protections: Women's rights also include protections against gender-based violence, such as domestic violence, sexual harassment, and harmful practices like child marriage and female genital mutilation. Legal frameworks that provide protection against these violations and promote gender equality are essential.
                   International Frameworks and Movements: Various international treaties and conventions, such as the Convention on the Elimination of All Forms of Discrimination against Women (CEDAW), provide a legal framework for the protection and promotion of women's rights. Feminist movements and women's rights activists play a crucial role in advocating for policy changes, raising awareness, and mobilizing action to address inequalities and injustices faced by women and girls.
                   Promoting women's rights and gender equality requires concerted efforts from governments, civil society, international organizations, and communities. It involves challenging deep-seated cultural norms and practices that perpetuate discrimination and inequality, ensuring legal protections are in place and effectively implemented, and empowering women and girls to participate fully in all aspects of life.
                   For comprehensive information and data on women's rights, including employment, health, political participation, and more, resources such as Our World in Data's page on Women’s Rights and the work of the OHCHR on gender equality and women's rights are invaluable.
                   Source: Our World in Data - Women’s Rights, OHCHR - Gender Equality and Women's Rights.""",

              "democracy": """Democracy encompasses a broad range of liberties and entitlements that are integral to our rights as citizens and ensuring equality. These rights include, but are not limited to, the right to live free from violence and discrimination, access to education, health care, economic opportunities, and political participation.
                    Anyone in the US gets the protections of the Constitution and access to basic human rights
                    Immigrants may be authorized to work in the US — those who are authorized to work pay taxes that contribute to services such as medicare
                    Unauthorized immigrants don’t get access to government entitlements such as medicare
                    75% of immigrants are here legally in some capacity —naturalized citizens, legal permanent residents (LPRs), or temporary visa holders. Half are citizens
                    Importance of Immigrants to US economy — Immigrants typically work in fields undesired by US born citizens such as agriculture, construction, domestic work and manufacturing. Trumps economic goals of restoring manufacturing in the US essentially rely on immigration. Immigrants buy into social programs via taxes that they can’t access if they don’t have citizenship.
                    ICE and their legal violations — The current deportation procedure in the US is inhumane and acting without due process. Immigrants in detention are not being given access to basic human rights — such as access to food, water and health care. They’re being held in over crowded facilities. They’re also not being given their right to a fair a trial while in detention.
                    Being undocumented in the US is not a crime. The large majority of immigrants captured by ice have no criminal records — many are children. Trumps messaging focused on only capturing criminals
                    Trump overreaches his rights as US president — he consistently oversteps the constitutional limits of the presidency, treating executive authority not as a public trust, but as a tool for personal and political gain. His administration blurred the lines between government power and individual interest — from pressuring DOJ officials to overturn election results, to ignoring court orders, to using the office to enrich private businesses.
            """,
              "immigration":
                    """Immigration in the U.S. touches on core questions of rights, fairness, and economic stability. Immigrants—whether naturalized citizens, lawful permanent residents, temporary workers, or asylum seekers—contribute to the economy, pay taxes, and sustain industries ranging from agriculture to construction to health care. Yet their access to protections and opportunities is uneven, shaped by status, geography, and shifting federal policies.
                    The U.S. unauthorized immigrant population reached a record 14 million in 2023, and roughly one in four adults worry that they or someone close to them could face deportation. Latino communities in particular report heightened fear, with concerns about family separation and loss of stability.
                    Detention practices highlight systemic abuses. Facilities like Florida’s “Alligator Alcatraz” have been criticized for unsafe, inhumane conditions—overcrowding, lack of medical care, and barriers to legal representation. Reports also document ICE detaining asylum seekers with legitimate claims, including Afghan allies and Central American migrants, often holding them without due process. Civil rights groups warn of widespread violations of basic human rights.
                    Despite these challenges, immigrants remain essential to the nation’s social and economic fabric. Policies that criminalize, detain, or strip away protections undermine not only immigrant communities but the broader economy and democratic commitments. The current moment reveals a stark divide between immigrants’ contributions and the precariousness of their rights.""",
              "corruption":
                    """Political corruption undermines public trust, weakens democratic institutions, and enriches those in power at the expense of ordinary people. Corruption takes many forms—self-dealing, conflicts of interest, intimidation of public officials, and the dismantling of accountability systems.
                    Under the Trump administration, watchdogs documented more than 3,000 instances of misconduct, including the use of public office to benefit private businesses, pressuring DOJ officials to overturn elections, and siphoning public funds for political gain. Investigations by the Brennan Center, CREW, and others highlight how Trump blurred the line between government authority and personal interest, from shutting down consumer protections to profiting off the Secret Service at his private resorts.
                    Corruption is not limited to the executive branch. Congress has faced its own scandals, and the judiciary is under increasing scrutiny: revelations about undisclosed gifts to Supreme Court justices and weakened bribery laws have raised alarms about accountability at the nation’s highest court. State and local officials also face intimidation and pressure, further eroding confidence in fair governance.
                    The cost is borne by the public—when taxpayer money is diverted, protections are dismantled, and ethics norms are ignored, ordinary Americans lose access to fair representation and essential services. Combating corruption requires stronger transparency rules, independent oversight, and a commitment to ethics that extends beyond partisanship.""",
              "economy":
                    """The U.S. economy shapes young people’s ability to live independently, pursue education, and build long-term financial security. Rising costs for housing, groceries, and education have made affordability a central concern for Gen Z, with belief in the American Dream falling to record lows. Inflation continues to outpace wage growth for many entry-level workers, creating long-term financial pressure.
                    Trade and tariff policies have contributed to rising prices and economic uncertainty. Tariffs on imports increase the cost of everyday goods—from bread and eggs to electronics—while slowing business investment and job creation. College graduates face a competitive labor market, with many struggling to find well-paying positions that keep pace with living costs.
                    Policy decisions around immigration, spending, and trade will shape economic opportunities for decades. Restrictions on labor mobility, cuts to public investment, and barriers to higher education can reduce overall productivity and limit upward mobility, leaving younger generations with slower career growth and fewer safety nets.
                    Looking ahead, the economic future for Gen Z depends on policies that address affordability, create stable job opportunities, and invest in long-term growth. Without these measures, young Americans may face continued financial insecurity, rising debt, and a shrinking window to achieve the milestones previous generations took for granted."""
            }

CAUSE_CONFIG = {
    "democracy": {
        "index": os.path.join(BASE_DIR, "rag_generation/democracy_index.faiss"),
        "chunks": os.path.join(BASE_DIR, "rag_generation/democracy_chunks.json")
    },
    "immigration": {
        "index": os.path.join(BASE_DIR, "rag_generation/immigration_index.faiss"),
        "chunks": os.path.join(BASE_DIR, "rag_generation/immigration_chunks.json")
    },
    "womens_rights": {
        "index": os.path.join(BASE_DIR, "rag_generation/womens_rights_index.faiss"),
        "chunks": os.path.join(BASE_DIR, "rag_generation/womens_rights_chunks.json")
    },
    "corruption": {
        "index": os.path.join(BASE_DIR, "rag_generation/corruption_index.faiss"),
        "chunks": os.path.join(BASE_DIR, "rag_generation/corruption_chunks.json")
    },
    "economy": {
        "index": os.path.join(BASE_DIR, "rag_generation/economy_index.faiss"),
        "chunks": os.path.join(BASE_DIR, "rag_generation/economy_chunks.json")
    }
}

COMPONENT_KEYS = [
    "opening_paragraph",
    "core_message",
    "supporting_evidence",
    "emotional_appeal",
    "call_to_action",
]

DEFAULT_CAUSE = "democracy"


# ---------------------- shared utilities ----------------------

def validate_article_url(u: str) -> bool:
    """Tiny SSRF/format guard for http(s) URLs."""
    try:
        p = urlparse(u)
        if p.scheme not in ("http", "https"):
            return False
        try:
            ip = ipaddress.ip_address(p.hostname) if p.hostname else None
            if ip and (ip.is_private or ip.is_loopback or ip.is_link_local):
                return False
        except ValueError:
            pass  # hostname is not a literal IP: allow
        return True
    except Exception:
        return False

def dedupe_preserve_order(items):
    seen, out = set(), []
    for x in items:
        if x not in seen:
            seen.add(x); out.append(x)
    return out

def format_news_facts(facts):
    facts = [s for s in facts if isinstance(s, str) and s.strip()]
    return "" if not facts else "Key news facts referenced:\n" + "\n".join(f"- {s}" for s in facts)

def resolve_big5(personality_type: str):
    persona = (personality_type or "").lower()
    presets = {
        "charismatic_leader":   {"openness": 3, "conscientiousness": 2, "extraversion": 3, "agreeableness": 3, "neuroticism": 1},
        "logical_analyst":      {"openness": 2, "conscientiousness": 3, "extraversion": 1, "agreeableness": 2, "neuroticism": 1},
        "passionate_advocate":  {"openness": 3, "conscientiousness": 2, "extraversion": 3, "agreeableness": 2, "neuroticism": 2},
        "empathetic_connector": {"openness": 2, "conscientiousness": 2, "extraversion": 2, "agreeableness": 3, "neuroticism": 3},
        "pragmatic_strategist": {"openness": 1, "conscientiousness": 3, "extraversion": 2, "agreeableness": 2, "neuroticism": 1},
        "fearless_challenger":  {"openness": 3, "conscientiousness": 1, "extraversion": 3, "agreeableness": 1, "neuroticism": 3},
        "diplomatic_peacemaker":{"openness": 2, "conscientiousness": 2, "extraversion": 2, "agreeableness": 3, "neuroticism": 2},
        "resilient_survivor":   {"openness": 1, "conscientiousness": 3, "extraversion": 1, "agreeableness": 1, "neuroticism": 3},
    }
    p = presets.get(persona, {})
    return {
        "openness":          p.get("openness", 2),
        "conscientiousness": p.get("conscientiousness", 2),
        "extraversion":      p.get("extraversion", 2),
        "agreeableness":     p.get("agreeableness", 2),
        "neuroticism":       p.get("neuroticism", 2),
    }

def build_persuasion_string(big5):
    return (
        f"O:{big5['openness']},"
        f"C:{big5['conscientiousness']},"
        f"E:{big5['extraversion']},"
        f"A:{big5['agreeableness']},"
        f"N:{big5['neuroticism']}"
    )

def truncate_text(s: str, max_chars: int = 6000) -> str:
    """Hard cap to keep prompts fast/safe."""
    return s if len(s) <= max_chars else s[:max_chars] + "\n...[truncated]"


def build_new_base_prompt(persuasion_string, cta_type, news_facts, chunk_facts, cause_label, cause_text, cause_context):
    if debug:
        print("BUILD NEW BASE PROMPT CALLED")
        print(persuasion_string)
        if news_facts:
            print(news_facts)
    """
    Constructs the base prompt with the given persuasion string as the first line.
    """
    cause_label = cause_label.replace("_", " ").title()

    new_base_prompt = (
            f"""

The OCEAN model, also known as the Big Five personality traits, provides a framework for tailoring communication strategies based on individual characteristics. Each trait can influence how messages are perceived and acted upon: Openness (O) reflects creativity, curiosity, and openness to new experiences; valid options are Low (1), Medium (2), and High (3). Conscientiousness (C) represents organization, dependability, and goal-oriented behavior; valid options are Low (1), Medium (2), and High (3). Extraversion (E) indicates sociability, energy, and engagement with others; valid options are Low (1), Medium (2), and High (3). Agreeableness (A) reflects empathy, cooperation, and trust in others; valid options are Low (1), Medium (2), and High (3). Neuroticism (N) measures emotional stability and resilience; valid options are Low (1), Medium (2), and High (3). By specifying values for O, C, E, A, and N, the campaign can be dynamically tailored to resonate with the target audience's personality traits. Use the following values to form the voice with which you will respond.

{persuasion_string}



Tech for Rights is an innovative platform dedicated to amplifying the voices of the moderate majority in a polarized world. By leveraging AI-enhanced messaging and a rich content repository, Tech for Rights empowers individuals and communities to engage in transparent, unbiased dialogue and drive meaningful political activism. Our mission is to harness the power of technology to bridge divides, foster mutual respect, and advocate for genuine initiatives that transcend rigid party lines. Through sophisticated collaboration tools and fact-checked resources, we support sustained engagement and informed discussions, ensuring that critical causes and initiatives receive the attention they deserve.

Cause: {cause_label}

This is what that cause means: {cause_text}

Your main job function is to build campaigns based on the parameters of the prompt with this base context as the core for your assembly instructions.

        Below you will find instructions on building a Rapid Response campaign. 

        These campaigns will have a specific call to action, which will serve as the central catalyst for you, the large 

        learning model, to assemble a cohesive campaign.


        ### Instruction for structure of a campaign:

- **Opening Spark**: Start with a compelling fact or urgent need.

- **Core Message**: Introduce the issue and its importance.

- **Supporting Evidence**: Provide an initial compelling fact or statistic to support the core message.

- **Emotional Appeal**: Encourage the audience to think about the positive impact of their engagement.

- **Call to Action**: Encourage the audience to follow and stay informed.

        ### Persuasion Instructions

        The following persuasion instructions are designed to refine the structure provided above. Tailor the campaign's 

        tone and style to match the target audience's persuasion type for maximum impact. Start with a strong, 

        compelling fact to grab attention, followed by clear and concise messages that provide practical information 

        and a logical call to action, maintaining a structured and results-oriented approach. The emotional appeal 

        should emphasize the positive impact of engagement, with infographics that clearly present data and actionable steps. 

        Specific instructions here:


Content Style:

Dynamic and Authentic: Focus on casual, relatable, or entertaining content that feels authentic rather than overly polished.

Trendy Elements: Use trending sounds, hashtags, and challenges to boost visibility. Add captions or subtitles for accessibility and engagement.

Quick Cuts and Edits: Employ fast-paced editing and transitions to keep viewers engaged. Include humor, emotion, or shock value where appropriate.


Audience:

Speak directly to the viewer, as if having a one-on-one conversation.

Content should focus on storytelling, education, or entertainment with a human touch.

Relate to the target audience's daily struggles, interests, or aspirations.

Script Template:



Hook (0-3 seconds): Open with a question, bold statement, or relatable scenario. Example: "Ever felt like life throws curveballs when you least expect it?"

Value or Insight (3-20 seconds): Provide a tip, hack, story, or valuable piece of advice. Example: "Here’s how Plan B gives you control when you need it most."

Call to Action (20-30 seconds): Encourage interaction. Example: "Tag someone who needs this info or hit that follow button for more."

Best Practices:



End with a clear call to action: "Follow for more tips" or "Share this with someone who might need it.



        These story facts need to be injected into cohesive social media campaign:

        {news_facts}
        
        These facts must be included as well:
        
        {chunk_facts}

        This context is also relevant and should be included:

        {cause_context}

        ### Output instructions:

        The campaign prompt should have variations for each of the possible components to allow the user to choose their 

        favorite from each and piece them together. The number of variations for each components will be 3 

        Each post includes detailed content divided into specific components. 

        The output should be formatted as a JSON object with the following structure: Each object should include: 

        opening_paragraph, core_message, supporting_evidence, emotional_appeal, and call_to_action. The output must be 

        able to be parsed and can therefore contain nothing more than JSON formatted code that meets the requirements.

        Here is an example of an acceptable response that could be parsed into JSON. This particular response shows

        that the amount of variations requested is variable. However you will include exactly 3 

        variations. 


        IMPORTANT NOTE: These Variations should be distinct from one another. This means that if you mention

        a fact in one of them, you may want to use another fact for the other variations. 

        This is to let the user have a wider selection of what facts they want to emphasize.


        This campaign's specific call to action type is: {cta_type.title()}.

        Make sure the final call to action emphasizes this action clearly.

        All call-to-actions must include a direct link to https://www.tech4rights.com/ 

""" + """        
        ### Example Output structure:

{
  "variations": {
    "opening_paragraph": [
        "Variation 1",
        "Variation 2",
        "Variation 3",
        ... "Variation N",
    ],
    "core_message": [
        "Variation 1",
        "Variation 2",
        "Variation 3",
        ... "Variation N",
    ],
    "supporting_evidence": [
        "Variation 1",
        "Variation 2",
        "Variation 3",
        ... "Variation N",
    ],
    "emotional_appeal": [
        "Variation 1",
        "Variation 2",
        "Variation 3",
        ... "Variation N",
    ],
    "call_to_action": [
        "Variation 1",
        "Variation 2",
        "Variation 3",
        ... "Variation N",
    ]
  }
}

Remember, these are just examples. Do not actually start of the message with "Variation N:"

"""

    )
    if debug:
        print("NEW BASE PROMPT: ", new_base_prompt)
    return new_base_prompt.strip()


def extract_news_facts(url):
    if debug:
        print("EXTRACT NEWS FACTS CALLED")
    """Scrape and extract key facts from a news article and return a JSON object:
       {"facts": ["fact 1", "fact 2", ...]}"""

    def _coerce_to_json_object(text):
        """Try to coerce model output into a JSON object with key 'facts'."""
        try:
            news_data = json.loads(text)
            if isinstance(news_data, dict) and isinstance(news_data.get("facts"), list) and all(isinstance(x, str) for x in news_data["facts"]):
                return news_data
        except json.JSONDecodeError:
            pass
        # Try to extract the first {...} block if any
        m = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if m:
            try:
                news_data = json.loads(m.group(0))
                if isinstance(news_data, dict) and isinstance(news_data.get("facts"), list) and all(isinstance(x, str) for x in news_data["facts"]):
                    return news_data
            except json.JSONDecodeError:
                pass
        # Last resort: split lines or wrap whole thing
        lines = [ln.strip("- •\t ").strip() for ln in text.splitlines()]
        facts = [ln for ln in lines if ln]
        return {"facts": facts[:12] or [text.strip()]}

    def _try_json_mode(article_text):
        """Attempt JSON mode (may 400 if model doesn't support response_format)."""
        chat_response = azure_client.chat.completions.create(
            model=AZURE_CHAT_DEPLOYMENT,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a precise information extractor. "
                        "Return ONLY valid JSON with this exact schema:\n"
                        '{ "facts": ["string", "string", ...] }\n'
                        "Rules:\n"
                        "- 5 to 12 concise facts.\n"
                        "- Each fact is a standalone string (<= 280 chars).\n"
                        "- No opinions, no duplicates, no summaries, no keys other than 'facts'."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        "Extract key factual statements (who/what/when/where/quantities/claims) "
                        "from the following news article text:\n\n" + article_text
                    ),
                },
            ],
        )
        return json.loads(chat_response.choices[0].message.content)

    def _via_function_call(article_text):
        """Force a structured result using function-calling (works without response_format)."""
        chat_response = azure_client.chat.completions.create(
            model=AZURE_CHAT_DEPLOYMENT,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "Extract 5-12 concise, standalone factual statements "
                        "(who/what/when/where/quantities/claims) from the user's article text. "
                        "Return them via the function call."
                    ),
                },
                {"role": "user", "content": article_text},
            ],
            tools=[
                {
                    "type": "function",
                    "function": {
                        "name": "record_facts",
                        "description": "Return the extracted key facts as strings.",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "facts": {
                                    "type": "array",
                                    "items": {"type": "string"},
                                    "minItems": 5,
                                    "maxItems": 12,
                                }
                            },
                            "required": ["facts"],
                            "additionalProperties": False,
                        },
                    },
                }
            ],
            tool_choice={"type": "function", "function": {"name": "record_facts"}},
        )
        msg = chat_response.choices[0].message
        if getattr(msg, "tool_calls", None):
            args_json = msg.tool_calls[0].function.arguments
            data = json.loads(args_json)
            facts = [s for s in data.get("facts", []) if isinstance(s, str) and s.strip()]
            return {"facts": facts}
        # If the model didn't tool-call, coerce whatever text we got
        return _coerce_to_json_object(msg.content or "")

    try:
        if debug:
            print("URL USED:", url)
        response = requests.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"},
            timeout=15,
            verify=False  # Disable SSL verification for development
        )
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract text from <p> tags
        paragraphs = soup.find_all("p")
        article_text = "\n".join(p.get_text(separator=" ", strip=True) for p in paragraphs)

        # First try JSON mode; if unsupported, fall back to function-calling
        try:
            news_data = _try_json_mode(article_text)
        except Exception as e:
            if debug:
                print("JSON mode failed; falling back to function-calling. Error:", e)
            news_data = _via_function_call(article_text)

        # Parse/validate JSON; coerce if necessary
        news_facts = news_data if (
            isinstance(news_data, dict)
            and isinstance(news_data.get("facts"), list)
            and all(isinstance(x, str) for x in news_data["facts"])
        ) else _coerce_to_json_object(json.dumps(news_data))

        if debug:
            print("FACTS COUNT:", len(news_facts.get("facts", [])))
            print("NEWS FACTS:", news_facts)
        return news_facts

    except Exception as e:
        print(f"Error extracting article: {e}")
        return {"facts": []}

def _normalize_causes(causes):
    """Return a de-duped list of supported cause keys (fallback to DEFAULT_CAUSE if empty)."""
    if isinstance(causes, str):
        causes = [causes]
    keys = []
    for c in (causes or []):
        k = str(c).strip().lower()
        if k in CAUSE_CONFIG and k not in keys:
            keys.append(k)
    return keys or [DEFAULT_CAUSE]


def extract_chunk_facts_json(
    causes,
    query_text: str | None = None,
    top_k: int = 3,
    max_facts: int | None = 30,
) -> dict:
    """
    Retrieve FAISS chunks per cause, send to the model, and return
    a JSON object: {"facts":[...], "by_cause": {"cause":[...]}}
    - Facts are concise strings, de-duped, order-preserved.
    - If query_text is provided, it's used as the retrieval seed; otherwise we seed with main_cause text + news facts upstream.
    """
    if debug:
        print("EXTRACT_CHUNK_FACTS_JSON CALLED")

    causes = _normalize_causes(causes)
    all_facts_flat = []
    by_cause = {}

    for cause in causes:
        cfg = CAUSE_CONFIG[cause]
        seed = (query_text or main_cause.get(cause, main_cause[DEFAULT_CAUSE])).strip()

        try:
            chunks = retrieve_context(
                query_text=seed,
                index_file=cfg["index"],
                chunks_file=cfg["chunks"],
                top_k=top_k,
            )
            text_input = chunks_to_text(chunks)
            if not text_input.strip():
                by_cause[cause] = []
                continue

            # Ask the model for structured facts (same schema as extract_news_facts)
            try:
                chat = azure_client.chat.completions.create(
                    model=AZURE_CHAT_DEPLOYMENT,
                    response_format={"type": "json_object"},
                    messages=[
                        {
                            "role": "system",
                            "content": (
                                "You are a precise information extractor. "
                                'Return ONLY valid JSON: { "facts": ["string", ...] }. '
                                "Rules: 5-12 concise standalone facts, no opinions, no duplicates."
                            ),
                        },
                        {
                            "role": "user",
                            "content": (
                                f"Extract key factual statements from the following context for cause '{cause}':\n\n"
                                + truncate_text(text_input, max_chars=6000)
                            ),
                        },
                    ],
                )
                data = json.loads(chat.choices[0].message.content or "{}")
                facts = [s for s in (data.get("facts") or []) if isinstance(s, str) and s.strip()]
            except Exception as e:
                if debug:
                    print("JSON mode failed in extract_chunk_facts_json:", e)
                # Fallback: very small coax without response_format
                chat = azure_client.chat.completions.create(
                    model=AZURE_CHAT_DEPLOYMENT,
                    messages=[
                        {"role": "system", "content": "List 5-12 concise factual statements, one per line."},
                        {"role": "user", "content": truncate_text(text_input, max_chars=6000)},
                    ],
                )
                lines = [(chat.choices[0].message.content or "").splitlines()]
                facts = [ln.strip("-• \t").strip() for ln in lines[0] if ln.strip()]

            # Per-cause de-dupe (order preserved)
            facts = dedupe_preserve_order([f for f in facts if f])
            by_cause[cause] = facts
            all_facts_flat.extend(facts)

        except Exception as e:
            if debug:
                print(f"❌ Retrieval error for cause '{cause}':", e)
            by_cause[cause] = []

    # Global de-dupe + optional cap
    flat = dedupe_preserve_order(all_facts_flat)
    if isinstance(max_facts, int) and max_facts > 0:
        flat = flat[:max_facts]

    return {"facts": flat, "by_cause": by_cause, "causes": causes, "top_k": top_k}


def retrieve_context(query_text, index_file, chunks_file, top_k=3):
    """Retrieve top-k text chunks from a FAISS index and chunk metadata file."""
    # Load index and chunks
    index = faiss.read_index(index_file)
    with open(chunks_file, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    # Embed query
    response = azure_client.embeddings.create(input=query_text, model=AZURE_EMBED_DEPLOYMENT)
    query_embedding = np.array([response.data[0].embedding], dtype="float32")

    # Search
    D, I = index.search(query_embedding, top_k)
    return [chunks[i] for i in I[0]]


def normalize_cause_keys(cause_key=None, cause_keys=None):
    """
    Accepts a single cause or a list; returns a non-empty list with fallback to DEFAULT_CAUSE.
    """
    keys = []
    if isinstance(cause_keys, list) and cause_keys:
        keys = [str(k).strip().lower() for k in cause_keys if k]
    elif cause_key:
        keys = [str(cause_key).strip().lower()]
    if not keys:
        keys = [DEFAULT_CAUSE]
    # de-dupe, keep order
    seen, out = set(), []
    for k in keys:
        if k not in seen:
            seen.add(k)
            out.append(k)
    return out


def chunks_to_text(chunks):
    """Join retrieved chunk dicts into a single plain-text block."""
    parts = []
    for c in chunks:
        t = c.get("text") if isinstance(c, dict) else None
        if t and isinstance(t, str):
            parts.append(t.strip())
    return "\n\n".join(parts)


# --- FIX build_context_blocks so it matches CAUSE_CONFIG and uses chunks_to_text ---
def build_context_blocks(cause_keys, formatted_news_facts):
    """
    Build one context string by retrieving top chunks for each cause key.
    Uses CAUSE_CONFIG paths: {'index': '...', 'chunks': '...'} and auto header labels.
    """
    seed = formatted_news_facts or ""
    sections = []

    # Provide labels; add more if you like
    header_labels = {
        "womens_rights": "Women's Rights Insights",
        "democracy": "Democracy Insights",
        "immigration": "Immigration Insights",
        "corruption": "Corruption Insights",
        "economy": "Economy Insights",
    }

    for raw_key in cause_keys:
        key = raw_key if raw_key in CAUSE_CONFIG else DEFAULT_CAUSE
        cfg = CAUSE_CONFIG[key]
        query_text = seed or main_cause.get(key, main_cause[DEFAULT_CAUSE])

        try:
            chunks = retrieve_context(
                query_text=query_text,
                index_file=cfg["index"],
                chunks_file=cfg["chunks"],
                top_k=3,
            )
            body = chunks_to_text(chunks)
            header = header_labels.get(key, "Relevant Insights")
            sections.append(f"\n\n{header}:\n{body}" if body else f"\n\n{header}:")
        except Exception as e:
            header = header_labels.get(key, "Relevant Insights")
            sections.append(f"\n\n{header}:")  # safe fallback

    return "".join(sections)


def classify_cause_from_facts(formatted_news_facts, timeout_secs: int = 20):
    """
    Returns: {"cause_keys": [<str>, ...], "confidence": <0..1>, "reason": <str>}
    """
    if debug:
        print("CLASSIFY CAUSE FROM FACTS CALLED")
    if not formatted_news_facts.strip():
        return {"cause_keys": [], "confidence": 0.0, "reason": "No facts provided."}

    choices = list(main_cause.keys())
    system = (
        "You are a careful classifier. Given news facts, pick zero or more best-matching causes "
        "from the provided allowed keys."
    )
    user = f"""
Facts:
{truncate_text(formatted_news_facts)}

Allowed cause keys: {choices}

Rules:
- Output ONLY valid JSON with keys: cause_keys (array of strings), confidence (0..1), reason (string).
- cause_keys must be a subset of {choices}. If none fit, use an empty array.
- Keep reason concise (<= 2 sentences).
"""

    try:
        resp = azure_client.chat.completions.create(
            model=AZURE_CHAT_DEPLOYMENT,
            max_tokens=180,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        raw = (resp.choices[0].message.content or "").strip()
        if raw.startswith("```"):
            raw = raw.strip("`")
            _, _, raw = raw.partition("\n")
        data = json.loads(raw)
        # validate
        ks = [k for k in data.get("cause_keys", []) if k in choices] if isinstance(data.get("cause_keys"), list) else []
        return {
            "cause_keys": ks,
            "confidence": float(data.get("confidence", 0.0)),
            "reason": data.get("reason", ""),
        }
    except Exception as e:
        return {"cause_keys": [], "confidence": 0.0, "reason": f"classification failed: {e}"}


def generate_campaign(prompt):
    if debug:
        print("GENERATE CAMPAIGN CALLED")
    """
    Generate a campaign using the OpenAI API with the given prompt.
    """
    try:
        response = azure_client.chat.completions.create(
            model=AZURE_CHAT_DEPLOYMENT,
            response_format={"type": "json_object"},  # <-- add this
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You return ONLY valid JSON. No code fences, no commentary, no Markdown. "
                        "Schema: {\"variations\": {\"opening_paragraph\":[], \"core_message\":[], "
                        "\"supporting_evidence\":[], \"emotional_appeal\":[], \"call_to_action\":[]}}"
                    )
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=1200,
        )

        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {str(e)}"


def parse_variation_list(response_text):
    if debug:
        print("PARSE VARIATION LIST CALLED")
    try:
        return json.loads(response_text)
    except Exception as e:
        print("Error parsing variation list:", e)
        return []


def parse_campaign_response(raw):
    if debug:
        print("PARSE CAMPAIGN RESPONSE CALLED")
    """
    Parse the JSON campaign response into structured components.
    """
    if not raw or not isinstance(raw, str):
        return {"error": "empty model response"}
    txt = raw.strip()
    if txt.startswith("```"):
        # strip code fences
        txt = txt.split("```", 2)[1] if "```" in txt else txt

    try:
        return json.loads(txt)
    except json.JSONDecodeError:
        # try to extract the largest {...} block
        m = re.search(r'\{(?:[^{}]|(?R))*\}', txt, flags=re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception as e:
                return {"error": f"JSON parsing error: {e}"}
        return {"error": "JSON parsing error: no object found"}


CHUNK_FACTS_CACHE_TTL = 60 * 30  # 30 minutes

def make_job_id() -> str:
    return uuid.uuid4().hex


def _cache_set(key: str, value: dict):
    cache.set(key, value, timeout=CHUNK_FACTS_CACHE_TTL)


def _cache_get(key: str) -> dict | None:
    return cache.get(key)


def init_job_state(job_id: str, url_facts: list[str], meta: dict | None = None):
    """
    Initialize the job record right after URL facts are ready.
    """
    state = {
        "status": "pending",      # pending -> done | error
        "url_facts": url_facts,   # already available
        "chunk_facts": None,      # will be filled when ready
        "error": None,
        "meta": meta or {},
    }
    _cache_set(f"factsjob:{job_id}", state)


def get_job_state(job_id: str) -> dict | None:
    return _cache_get(f"factsjob:{job_id}")


def set_job_done(job_id: str, chunk_facts: dict):
    st = get_job_state(job_id) or {}
    st.update({"status": "done", "chunk_facts": chunk_facts, "error": None})
    _cache_set(f"factsjob:{job_id}", st)


def set_job_error(job_id: str, err_msg: str):
    st = get_job_state(job_id) or {}
    st.update({"status": "error", "error": err_msg})
    _cache_set(f"factsjob:{job_id}", st)


def start_chunk_facts_async(job_id: str, causes, query_text: str | None, top_k: int, max_facts: int | None):
    """
    Fire-and-forget background thread to compute chunk facts and store them into cache.
    """
    def _runner():
        try:
            res = extract_chunk_facts_json(
                causes=causes,
                query_text=query_text,
                top_k=top_k,
                max_facts=max_facts
            )
            # store only what you need client-side; you can include by_cause if helpful
            set_job_done(job_id, {
                "facts": res.get("facts", []),
                "by_cause": res.get("by_cause", {}),
                "causes": res.get("causes", []),
                "top_k": res.get("top_k", top_k),
            })
        except Exception as e:
            err_msg = f"{e.__class__.__name__}: {e}"
            try:
                tb = traceback.format_exc(limit=2)
                err_msg = f"{err_msg}\n{tb}"
            except:
                pass
            set_job_error(job_id, err_msg)

    t = threading.Thread(target=_runner, name=f"chunkfacts-{job_id[:8]}", daemon=True)
    t.start()
    return t