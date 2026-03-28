/**
 * natureData.js
 * Mock API – local nature stories for Year 2 students.
 * Focus: Australian themes (Koalas, Great Barrier Reef, Humpback Whales, Space, etc.)
 * Each story has: id, title, summary, fullContent, keywords, emoji
 */

const NATURE_STORIES = [
  {
    id: 'nature-au-1',
    title: 'Koalas: Australia\'s Sleepy Tree Bears',
    emoji: '🐨',
    summary:
      'Koalas are one of Australia\'s most loved animals. They sleep up to 22 hours a day and only eat eucalyptus leaves. Find out why these fluffy animals are so special!',
    fullContent: `Koalas are one of the most famous animals in Australia. With their big fluffy ears, round black noses, and soft grey fur, it is easy to see why people all over the world love them. But koalas are not bears — they are marsupials, which means they carry their babies in a special pouch on their belly.

Koalas spend most of their lives high up in eucalyptus trees, also called gum trees. They eat eucalyptus leaves, which most other animals cannot digest because the leaves contain a poison called tannin. Koalas have a special stomach that helps them break down this poison safely. Because eucalyptus leaves have very little energy, koalas need to sleep for up to 22 hours every day to save their energy!

Baby koalas are called joeys. When a joey is born, it is no bigger than a jellybean! It crawls straight into its mother's pouch, where it stays warm and drinks milk for about six months. When the joey gets bigger, it rides on its mother's back and learns which gum leaves are safe to eat.

Sadly, koalas are under threat. Forests are being cleared to make way for homes and roads, leaving koalas without places to live. Koalas can also be hurt by cars and pet dogs. Many Australian scientists and volunteers work hard to protect koala habitats and help injured koalas recover at special wildlife hospitals.

You can help koalas too! By learning about them and sharing their story, you are helping to spread the word about why these incredible animals need our protection.`,
    keywords: ['koala', 'marsupial', 'eucalyptus', 'joey', 'Australia', 'gum tree', 'wildlife'],
  },
  {
    id: 'nature-au-2',
    title: 'The Great Barrier Reef: An Underwater Rainbow',
    emoji: '🐠',
    summary:
      'The Great Barrier Reef off the coast of Queensland is the largest coral reef system on Earth. It is home to thousands of amazing sea creatures and is so big it can be seen from space!',
    fullContent: `The Great Barrier Reef stretches along the coast of Queensland in northeastern Australia for more than 2,300 kilometres. It is the world's largest coral reef system and is so enormous that it can even be seen from outer space! The reef is made up of nearly 3,000 individual reefs and 900 islands.

Coral reefs are sometimes called "the rainforests of the sea" because they are home to an incredible number of living things. More than 1,500 species of fish swim through the reef's warm, clear waters. You might spot clownfish hiding among waving sea anemones, just like the famous movie character Nemo! Giant sea turtles glide gracefully between colourful coral formations, while seahorses wrap their tiny tails around sea plants to keep from floating away.

The coral itself is a living animal, not a rock or a plant. Tiny animals called coral polyps build hard limestone homes around their soft bodies. Over thousands of years, millions of these structures join together to form the massive reef we see today. Coral gets its amazing colours from tiny plants called algae that live inside it.

Sadly, the Great Barrier Reef is in danger. Rising ocean temperatures cause "coral bleaching," which turns the coral white and can kill it. Pollution from farms and cities washes into the sea and harms the reef. The Australian government and scientists around the world are working hard to protect this natural treasure.

Visiting the reef is a magical experience that many Australians treasure. Even if you cannot visit in person, photographs and videos show just how breathtakingly beautiful this underwater world truly is.`,
    keywords: ['Great Barrier Reef', 'coral', 'Queensland', 'fish', 'ocean', 'turtle', 'Australia', 'marine'],
  },
  {
    id: 'nature-au-3',
    title: 'Humpback Whales: Giants of the Ocean',
    emoji: '🐋',
    summary:
      'Humpback whales are enormous animals that travel thousands of kilometres every year. They are famous for their beautiful songs and for leaping out of the water in a behaviour called breaching.',
    fullContent: `Humpback whales are among the largest animals on Earth. An adult humpback can grow up to 16 metres long — that is about as long as a school bus — and weigh up to 36,000 kilograms! Every year, humpback whales travel from the cold waters of Antarctica to the warm waters near Australia to have their babies. This long journey is called migration.

As the whales swim northward past the coast of eastern Australia, people gather on headlands and take whale-watching boat tours to see these magnificent creatures. Humpback whales are famous for "breaching" — launching their enormous bodies almost completely out of the water and then crashing back down with a huge splash. Scientists are not entirely sure why they do this, but it might be to communicate with other whales or simply to play!

Male humpback whales are also renowned for their songs. A whale song can last for hours and can be heard by other whales hundreds of kilometres away. The songs are complex patterns of moans, howls, and cries. Every whale in a group sings the same song, but the song slowly changes over time.

Humpback whales eat tiny shrimp-like creatures called krill. They have a clever hunting technique called "bubble-net feeding," where a group of whales swim in circles and blow bubbles to trap krill in a column, then lunge upward with their mouths wide open.

Humpback whale populations were once severely reduced by hunting, but after international protections were put in place, their numbers have been recovering. Today, seeing a humpback whale in the wild is one of Australia's most exciting wildlife experiences.`,
    keywords: ['humpback whale', 'migration', 'breaching', 'ocean', 'Antarctica', 'Australia', 'krill', 'song'],
  },
  {
    id: 'nature-au-4',
    title: 'Space: Exploring the Universe from Australia',
    emoji: '🌌',
    summary:
      'Australia plays an important role in space exploration. The Parkes Radio Telescope helped bring the Apollo 11 moon landing to the world, and astronomers in Australia discover new stars and galaxies every year.',
    fullContent: `Australia might be famous for its kangaroos and beaches, but it is also one of the best places in the world to study space! Because Australia is in the Southern Hemisphere, astronomers here can see parts of the night sky that cannot be seen from Europe or North America. On a clear night away from city lights, the Milky Way stretches across the Australian sky like a glittering river of stars.

One of Australia's most famous telescopes is the Parkes Radio Telescope in New South Wales — nicknamed "The Dish." This giant dish-shaped antenna is 64 metres wide and picks up radio waves from distant stars and galaxies. In 1969, The Dish played a vital role in broadcasting the first live television images of astronaut Neil Armstrong walking on the Moon to an astonished world!

Australia is also home to the Australian Square Kilometre Array Pathfinder (ASKAP) in Western Australia. This extraordinary telescope is made up of 36 dish antennas working together to create incredibly detailed maps of the universe. Scientists use ASKAP to discover new galaxies and study mysterious cosmic events.

The night sky holds many wonders. Our nearest star, the Sun, is 150 million kilometres away. The next closest star, Proxima Centauri, is so far away that its light takes over four years to reach us. The Milky Way galaxy contains more than 200 billion stars!

Young Australians today are being inspired to become the next generation of astronomers, engineers, and astronauts. With new space agencies and exciting missions planned for the coming decades, the universe is waiting to be explored!`,
    keywords: ['space', 'telescope', 'stars', 'Milky Way', 'Australia', 'Parkes', 'astronomer', 'galaxy'],
  },
  {
    id: 'nature-au-5',
    title: 'The Platypus: Nature\'s Most Surprising Animal',
    emoji: '🦆',
    summary:
      'The platypus is one of the world\'s strangest animals. It has a duck\'s bill, a beaver\'s tail, and otter\'s feet — and it even lays eggs! Only found in Australia, the platypus is truly one of a kind.',
    fullContent: `When European scientists first saw a platypus skin sent from Australia in 1799, many thought it was a joke! They believed someone had sewn a duck's bill onto a beaver's body. But the platypus is completely real, and it is one of the most extraordinary animals on our planet.

The platypus lives in freshwater rivers and streams in eastern Australia and Tasmania. It has a broad, flat bill like a duck, a beaver-like tail that stores fat for energy, and webbed feet perfect for swimming. Its thick, brown fur is waterproof, keeping the platypus warm and dry even when diving underwater.

What makes the platypus truly remarkable is that it is a mammal that lays eggs. Most mammals give birth to live young and feed them milk. The platypus lays one to three small, leathery eggs in a burrow by the riverbank. After the eggs hatch, the mother feeds her tiny babies milk that seeps through her skin, since she has no nipples.

The platypus is an expert swimmer and diver. When it dives underwater to hunt, it closes its eyes, ears, and nose — and uses its bill to detect the tiny electrical signals given off by shrimp, worms, and insect larvae moving in the mud. This ability, called electroreception, makes it a remarkably effective hunter even in murky water.

Male platypuses have a sharp spur on each hind leg that can deliver venom. This is unusual — very few mammals are venomous!

The platypus is a shy and secretive animal, but Australians are immensely proud of this strange and wonderful creature that exists nowhere else on Earth.`,
    keywords: ['platypus', 'Australia', 'mammal', 'eggs', 'river', 'bill', 'electroreception', 'Tasmania'],
  },
  {
    id: 'nature-au-6',
    title: 'The Wonders of the Australian Outback',
    emoji: '🦘',
    summary:
      'The Australian Outback is a vast, dry region that covers much of the continent. It is home to incredible wildlife, ancient rock formations, and the world\'s largest monolith — Uluru.',
    fullContent: `The Australian Outback is one of the most extraordinary places on Earth. Covering millions of square kilometres of dry, flat land, it stretches across the heart of Australia. The Outback receives very little rain each year, and temperatures can soar above 40 degrees Celsius during the day, then drop close to freezing at night!

Despite these harsh conditions, the Outback is teeming with life. Red kangaroos bound across the dry plains in large groups called mobs. A big male red kangaroo can leap over three metres high and travel ten metres in a single bound! Emus, the world's second-largest bird, stride across the scrubland on their powerful legs. These birds cannot fly, but they are excellent runners.

The most famous landmark in the Outback is Uluru, also known as Ayers Rock. This enormous sandstone rock rises 348 metres out of the flat desert and is about 9.4 kilometres around its base. Uluru glows brilliant red at sunrise and sunset, changing colour as the light shifts. For the Anangu people — the traditional owners of the land — Uluru is deeply sacred and holds thousands of years of cultural stories.

The Outback is also home to ancient Aboriginal art, with rock paintings and carvings that date back tens of thousands of years. These artworks tell stories about the land, the animals, and the "Dreamtime" — the Aboriginal understanding of how the world was created.

Visiting the Outback is an unforgettable adventure. Beneath a sky blazing with stars, surrounded by ancient red earth, you truly understand what makes Australia such a unique and special country.`,
    keywords: ['Outback', 'kangaroo', 'Uluru', 'Australia', 'desert', 'emu', 'Aboriginal', 'Dreamtime'],
  },
  {
    id: 'nature-au-7',
    title: 'Sea Turtles: Ancient Mariners of the Ocean',
    emoji: '🐢',
    summary:
      'Sea turtles have lived on Earth for more than 100 million years. Australia is home to six of the world\'s seven sea turtle species, and many nest on Queensland\'s beaches every year.',
    fullContent: `Sea turtles are one of the oldest living creatures on Earth. They have been swimming through the world's oceans for more than 100 million years — even longer than the dinosaurs! Today, there are seven species of sea turtle in the world, and Australia is home to six of them.

Every summer, female sea turtles return to the very beach where they were born to lay their own eggs. This incredible journey can span thousands of kilometres across open ocean. Scientists believe sea turtles use the Earth's magnetic field like a compass to navigate, always finding their way back to their birth beach.

On Queensland's beaches, particularly near Mon Repos near Bundaberg, thousands of loggerhead and flatback turtles come ashore each year to nest. Under the cover of darkness, a female turtle slowly crawls up the sand, digs a deep hole with her flippers, and lays around 100 round, white eggs. She then covers the eggs with sand and returns to the sea. About eight weeks later, the tiny hatchlings dig their way to the surface, usually at night, and scramble towards the ocean.

The journey from nest to sea is extremely dangerous for hatchlings. Birds, crabs, and fish all prey on the tiny turtles. Only about one in every thousand hatchlings survives to adulthood.

Green sea turtles, which feed on seagrass and algae in shallow coastal waters, can live for up to 80 years! Their beautiful shells and graceful swimming make them a favourite sight for snorkellers and divers on the Great Barrier Reef.

Conservation efforts across Australia help protect nesting beaches and give these ancient mariners the best chance of survival.`,
    keywords: ['sea turtle', 'Australia', 'Queensland', 'ocean', 'nesting', 'hatchling', 'Great Barrier Reef', 'conservation'],
  },
]

export default NATURE_STORIES
