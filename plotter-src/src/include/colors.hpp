#ifndef _colors_h_
#include <array>

#define _colors_h_

static const std::array< std::array<unsigned char, 3>, 151 > CSSCOLORS = {{
        /* Plot.ly colors */
        {31, 119, 180},
        {255, 127, 14},
        {44, 160, 44},
        {214, 39, 40},
        {148, 103, 189},
        {140, 86, 75},
        {227, 119, 194},
        {127, 127, 127},
        {188, 189, 34},
        {23, 190, 207},

        /* dumped colors */
        {255, 0, 0}, // Red
        {0, 128, 0}, // Green
        {0, 0, 255}, // Blue
        {255, 165, 0}, // Orange
        {0, 255, 255}, // Cyan
        {238, 130, 238}, // Violet
        {0, 255, 0}, // Lime
        {0, 0, 128}, // Navy
        {0, 128, 128}, // Teal
        {144, 238, 144}, // LightGreen
        {139, 0, 0}, // DarkRed
        {205, 133, 63}, // Peru
        {255, 192, 203}, // Pink
        {221, 160, 221}, // Plum
        {255, 215, 0}, // Gold
        {128, 128, 128}, // Gray
        {128, 128, 128}, // Grey
        {240, 255, 255}, // Azure
        {245, 245, 220}, // Beige
        {245, 222, 179}, // Wheat
        {165, 42, 42}, // Brown
        {255, 127, 80}, // Coral
        {250, 240, 230}, // Linen
        {128, 128, 0}, // Olive
        {240, 230, 140}, // Khaki
        {255, 255, 240}, // Ivory
        {255, 255, 0}, // Yellow
        {255, 228, 196}, // Bisque
        {128, 0, 0}, // Maroon
        {255, 99, 71}, // Tomato
        {218, 112, 214}, // Orchid
        {192, 192, 192}, // Silver
        {160, 82, 45}, // Sienna
        {250, 128, 114}, // Salmon
        {128, 0, 128}, // Purple
        {75, 0, 130}, // Indigo
        {255, 0, 255}, // Magenta
        {220, 20, 60}, // Crimson
        {216, 191, 216}, // Thistle
        {253, 245, 230}, // OldLace
        {135, 206, 235}, // SkyBlue
        {105, 105, 105}, // DimGray
        {105, 105, 105}, // DimGrey
        {255, 0, 255}, // Fuchsia
        {255, 105, 180}, // HotPink
        {255, 228, 181}, // Moccasin
        {255, 248, 220}, // Cornsilk
        {0, 0, 139}, // DarkBlue
        {0, 139, 139}, // DarkCyan
        {169, 169, 169}, // DarkGray
        {169, 169, 169}, // DarkGrey
        {255, 20, 147}, // DeepPink
        {255, 245, 238}, // SeaShell
        {46, 139, 87}, // SeaGreen
        {230, 230, 250}, // Lavender
        {240, 255, 240}, // HoneyDew
        {152, 251, 152}, // PaleGreen
        {205, 92, 92}, // IndianRed
        {188, 143, 143}, // RosyBrown
        {220, 220, 220}, // Gainsboro
        {65, 105, 225}, // RoyalBlue
        {178, 34, 34}, // FireBrick
        {255, 218, 185}, // PeachPuff
        {255, 182, 193}, // LightPink
        {255, 69, 0}, // OrangeRed
        {107, 142, 35}, // OliveDrab
        {70, 130, 180}, // SteelBlue
        {0, 100, 0}, // DarkGreen
        {64, 224, 208}, // Turquoise
        {95, 158, 160}, // CadetBlue
        {255, 228, 225}, // MistyRose
        {218, 165, 32}, // GoldenRod
        {124, 252, 0}, // LawnGreen
        {173, 216, 230}, // LightBlue
        {224, 255, 255}, // LightCyan
        {211, 211, 211}, // LightGrey
        {211, 211, 211}, // LightGray
        {240, 248, 255}, // AliceBlue
        {106, 90, 205}, // SlateBlue
        {112, 128, 144}, // SlateGray
        {112, 128, 144}, // SlateGrey
        {189, 183, 107}, // DarkKhaki
        {50, 205, 50}, // LimeGreen
        {210, 105, 30}, // Chocolate
        {222, 184, 135}, // BurlyWood
        {245, 255, 250}, // MintCream
        {255, 140, 0}, // DarkOrange
        {30, 144, 255}, // DodgerBlue
        {244, 164, 96}, // SandyBrown
        {255, 239, 213}, // PapayaWhip
        {248, 248, 255}, // GhostWhite
        {240, 128, 128}, // LightCoral
        {176, 224, 230}, // PowderBlue
        {127, 255, 212}, // Aquamarine
        {245, 245, 245}, // WhiteSmoke
        {138, 43, 226}, // BlueViolet
        {127, 255, 0}, // Chartreuse
        {153, 50, 204}, // DarkOrchid
        {0, 0, 205}, // MediumBlue
        {233, 150, 122}, // DarkSalmon
        {148, 0, 211}, // DarkViolet
        {0, 191, 255}, // DeepSkyBlue
        {255, 160, 122}, // LightSalmon
        {255, 250, 240}, // FloralWhite
        {139, 69, 19}, // SaddleBrown
        {34, 139, 34}, // ForestGreen
        {173, 255, 47}, // GreenYellow
        {139, 0, 139}, // DarkMagenta
        {255, 222, 173}, // NavajoWhite
        {255, 255, 224}, // LightYellow
        {0, 255, 127}, // SpringGreen
        {154, 205, 50}, // YellowGreen
        {147, 112, 219}, // MediumPurple
        {25, 25, 112}, // MidnightBlue
        {186, 85, 211}, // MediumOrchid
        {143, 188, 143}, // DarkSeaGreen
        {250, 235, 215}, // AntiqueWhite
        {255, 250, 205}, // LemonChiffon
        {135, 206, 250}, // LightSkyBlue
        {72, 61, 139}, // DarkSlateBlue
        {255, 240, 245}, // LavenderBlush
        {219, 112, 147}, // PaleVioletRed
        {184, 134, 11}, // DarkGoldenRod
        {47, 79, 79}, // DarkSlateGrey
        {238, 232, 170}, // PaleGoldenRod
        {32, 178, 170}, // LightSeaGreen
        {0, 206, 209}, // DarkTurquoise
        {47, 79, 79}, // DarkSlateGray
        {175, 238, 238}, // PaleTurquoise
        {119, 136, 153}, // LightSlateGray
        {85, 107, 47}, // DarkOliveGreen
        {255, 235, 205}, // BlanchedAlmond
        {119, 136, 153}, // LightSlateGrey
        {60, 179, 113}, // MediumSeaGreen
        {100, 149, 237}, // CornflowerBlue
        {176, 196, 222}, // LightSteelBlue
        {123, 104, 238}, // MediumSlateBlue
        {72, 209, 204}, // MediumTurquoise
        {199, 21, 133}, // MediumVioletRed
        {102, 205, 170}, // MediumAquaMarine
        {0, 250, 154}, // MediumSpringGreen
    }
};

#endif