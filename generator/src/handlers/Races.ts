import { Handler } from '#src/types/handler.js';

import { BinaryOperator, Expression, MemberExpression } from 'acorn';
import { simple } from 'acorn-walk';

import {
  isIdentifier,
  isLiteral,
  isMemberExpression,
  isPrivateIdentifier,
} from '#src/utils/ast.js';
import { log } from '#src/utils/log.js';
import { string } from '#src/utils/sort.js';
import { titleCase } from '#src/utils/string.js';

export const Races: Handler = function (data, result) {
  const races = new Set<string>();

  const equalityOperators: BinaryOperator[] = [
    '==',
    '===',
    '!=',
    '!==',
  ];

  data.content.forEach(function (content) {
    simple(content.ast, {
      // originalRace gets set to a lot of junk, to list just a few examples:
      // - ????
      // - aircraft
      // - Clydesdale K7
      // - NOT SET
      // - sand worm
      // Even with just BinaryExpression checks there is already junk.
      // Having to maintain an even bigger list of edge cases is not worth it, may miss some, but whatever.

      // <?>.originalRace = 'value'
      // AssignmentExpression(node) {
      //   if (!isMemberExpression(node.left)) {
      //     return;
      //   }

      //   if (!isIdentifier(node.left.property)) {
      //     return;
      //   }

      //   if (node.left.property.name !== 'originalRace') {
      //     return;
      //   }

      //   if (!isLiteral(node.right)) {
      //     return;
      //   }

      //   if (typeof node.right.value !== 'string') {
      //     return;
      //   }

      //   races.add(node.right.value);
      // },

      // <?>.originalRace === 'value'
      // <?>.originalRace !== 'value'
      BinaryExpression(node) {
        if (!equalityOperators.includes(node.operator)) {
          return;
        }

        let member: MemberExpression;
        let value: Expression;

        if (isMemberExpression(node.left)) {
          member = node.left;
          value = node.right;
        }
        else if (isMemberExpression(node.right) && !isPrivateIdentifier(node.left)) {
          member = node.right;
          value = node.left;
        }
        else {
          return;
        }

        if (!isIdentifier(member.property)) {
          return;
        }

        if (member.property.name !== 'originalRace') {
          return;
        }

        if (!isLiteral(value)) {
          return;
        }

        if (typeof value.value !== 'string') {
          return;
        }

        races.add(value.value);
      },
    });
  });

  const edgeCases: string[] = [
    'conglomerate',
    'cyborg',
    'NOT SET',
    'robot',
  ];

  edgeCases.forEach(function (race) {
    races.delete(race);
  });

  log(`Generated ${races.size} races`);

  result.options.races = Array.from(races).sort(string.asc).map(function (race) {
    return {
      value: race,
      label: titleCase(race),
    };
  });
};
