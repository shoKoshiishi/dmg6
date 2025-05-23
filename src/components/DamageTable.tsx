import React from 'react';
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography } from '@mui/material';

export interface DamageTableRow {
  part: string;
  state: string;
  damage: string; // 合計ダメージ（物理+属性）
  critDamage: string;
  expected: string;
  physical: number;
  elemental: number;
  critRate?: number; // 期待会心率（0-1）
}

interface DamageTableProps {
  rows: DamageTableRow[];
}

const DamageTable: React.FC<DamageTableProps> = ({ rows }) => {
  // 部位ごとにrowSpanを計算
  const partRowSpans: Record<string, number> = {};
  rows.forEach(row => {
    partRowSpans[row.part] = (partRowSpans[row.part] || 0) + 1;
  });
  const renderedParts: Record<string, boolean> = {};

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>
        ダメージ表
      </Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>部位</TableCell>
              <TableCell>状態</TableCell>
              <TableCell>ダメージ合計</TableCell>
              <TableCell>会心ダメージ合計</TableCell>
              <TableCell>期待会心率</TableCell>
              <TableCell>期待値</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const showPart = !renderedParts[row.part];
              if (showPart) renderedParts[row.part] = true;
              return (
                <TableRow key={`${row.part}-${row.state}`}>
                  {showPart ? (
                    <TableCell rowSpan={partRowSpans[row.part]}>{row.part}</TableCell>
                  ) : null}
                  <TableCell>{row.state}</TableCell>
                  <TableCell>
                    {row.damage.split(' ')[0]}
                    {row.elemental !== 0 && (
                      <>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {row.elemental}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.critDamage.split(' ')[0]}
                    {row.elemental !== 0 && (
                      <>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {row.elemental}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.critRate !== undefined ? `${Math.round(row.critRate * 100)}%` : '-'}
                  </TableCell>
                  <TableCell>
                    {row.expected.split(' ')[0]}
                    {row.elemental !== 0 && (
                      <>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {row.elemental}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DamageTable;
